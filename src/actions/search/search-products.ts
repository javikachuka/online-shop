'use server';

import prisma from '@/lib/prisma';
import { normalizeSearchText, validateSearchTerm, calculateRelevance } from '@/utils/search-utils';

export interface SearchFilters {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  attributes?: { [key: string]: string[] }; // attributeId: [valueIds]
  sortBy?: 'relevance' | 'price-asc' | 'price-desc' | 'newest' | 'name';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  products: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: {
    categories: { id: string; name: string; count: number }[];
    priceRange: { min: number; max: number };
    attributes: {
      id: string;
      name: string;
      values: { id: string; value: string; count: number }[];
    }[];
  };
  searchInfo: {
    query: string;
    normalizedQuery: string;
    totalResults: number;
    executionTime: number;
  };
}

export const searchProducts = async (filters: SearchFilters = {}): Promise<SearchResult> => {
  const startTime = Date.now();
  
  const {
    query = '',
    categoryId,
    minPrice,
    maxPrice,
    attributes = {},
    sortBy = 'relevance',
    page = 1,
    limit = 12
  } = filters;

  // Validar término de búsqueda
  const validation = validateSearchTerm(query);
  const searchQuery = validation.cleanTerm;
  const normalizedQuery = normalizeSearchText(searchQuery);

  try {
    // Construir condiciones de filtro
    const whereConditions: any = {
      isEnabled: true,
      variants: {
        some: {
          stock: { gt: 0 }
        }
      }
    };

    // Filtro de texto
    if (searchQuery && validation.isValid) {
      whereConditions.OR = [
        {
          title: {
            contains: normalizedQuery,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: normalizedQuery,
            mode: 'insensitive'
          }
        },
        {
          tags: {
            has: normalizedQuery
          }
        },
        {
          categories: {
            some: {
              category: {
                name: {
                  contains: normalizedQuery,
                  mode: 'insensitive'
                }
              }
            }
          }
        }
      ];
    }

    // Filtro por categoría
    if (categoryId) {
      whereConditions.categories = {
        some: {
          categoryId: categoryId
        }
      };
    }

    // Filtro por precio
    if (minPrice !== undefined || maxPrice !== undefined) {
      whereConditions.variants = {
        some: {
          AND: [
            { stock: { gt: 0 } },
            ...(minPrice !== undefined ? [{ price: { gte: minPrice } }] : []),
            ...(maxPrice !== undefined ? [{ price: { lte: maxPrice } }] : [])
          ]
        }
      };
    }

    // Filtros por atributos
    if (Object.keys(attributes).length > 0) {
      const attributeConditions = Object.entries(attributes).map(([attributeId, valueIds]) => ({
        variants: {
          some: {
            attributes: {
              some: {
                attributeId: attributeId,
                valueId: { in: valueIds }
              }
            }
          }
        }
      }));

      whereConditions.AND = attributeConditions;
    }

    // Obtener productos con paginación
    const skip = (page - 1) * limit;
    
    let orderBy: any = {};
    
    switch (sortBy) {
      case 'price-asc':
        orderBy = {
          variants: {
            _min: {
              price: 'asc'
            }
          }
        };
        break;
      case 'price-desc':
        orderBy = {
          variants: {
            _min: {
              price: 'desc'
            }
          }
        };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'name':
        orderBy = { title: 'asc' };
        break;
      default: // relevance
        orderBy = { title: 'asc' }; // Por defecto, luego ordenaremos por relevancia
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereConditions,
        include: {
          ProductImage: {
            take: 1,
            select: { url: true }
          },
          variants: {
            where: { stock: { gt: 0 } },
            select: {
              id: true,
              price: true,
              discountPercent: true,
              stock: true,
              attributes: {
                include: {
                  attribute: true,
                  value: true
                }
              }
            },
            orderBy: { price: 'asc' },
            take: 1
          },
          categories: {
            include: {
              category: {
                select: { id: true, name: true, slug: true }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy
      }),
      prisma.product.count({ where: whereConditions })
    ]);

    // Ordenar por relevancia si es necesario
    let sortedProducts = products;
    if (sortBy === 'relevance' && searchQuery && validation.isValid) {
      sortedProducts = products.sort((a, b) => {
        const relevanceA = calculateRelevance(a.title + ' ' + a.description, searchQuery);
        const relevanceB = calculateRelevance(b.title + ' ' + b.description, searchQuery);
        return relevanceB - relevanceA;
      });
    }

    // Obtener filtros disponibles
    const filters = await getAvailableFilters(whereConditions, searchQuery);

    const executionTime = Date.now() - startTime;

    return {
      products: sortedProducts.map(product => ({
        ...product,
        image: product.ProductImage[0]?.url || '/imgs/placeholder.jpg',
        minPrice: product.variants[0]?.price || 0,
        discountPercent: product.variants[0]?.discountPercent || 0,
        inStock: product.variants.some(v => v.stock > 0)
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters,
      searchInfo: {
        query: searchQuery,
        normalizedQuery,
        totalResults: total,
        executionTime
      }
    };

  } catch (error) {
    console.error('Error in searchProducts:', error);
    
    return {
      products: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      filters: {
        categories: [],
        priceRange: { min: 0, max: 0 },
        attributes: []
      },
      searchInfo: {
        query: searchQuery,
        normalizedQuery,
        totalResults: 0,
        executionTime: Date.now() - startTime
      }
    };
  }
};

// Función auxiliar para obtener filtros disponibles
const getAvailableFilters = async (baseWhereConditions: any, searchQuery: string) => {
  try {
    // Obtener categorías con conteo
    const categoriesWithCount = await prisma.category.findMany({
      where: {
        isEnabled: true,
        products: {
          some: {
            product: baseWhereConditions
          }
        }
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                product: baseWhereConditions
              }
            }
          }
        }
      }
    });

    // Obtener rango de precios
    const priceStats = await prisma.productVariant.aggregate({
      where: {
        stock: { gt: 0 },
        product: baseWhereConditions
      },
      _min: { price: true },
      _max: { price: true }
    });

    // Obtener atributos disponibles
    const attributesWithValues = await prisma.attribute.findMany({
      where: {
        variants: {
          some: {
            variant: {
              stock: { gt: 0 },
              product: baseWhereConditions
            }
          }
        }
      },
      include: {
        values: {
          where: {
            variants: {
              some: {
                variant: {
                  stock: { gt: 0 },
                  product: baseWhereConditions
                }
              }
            }
          },
          include: {
            _count: {
              select: {
                variants: {
                  where: {
                    variant: {
                      stock: { gt: 0 },
                      product: baseWhereConditions
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    return {
      categories: categoriesWithCount.map(cat => ({
        id: cat.id,
        name: cat.name,
        count: cat._count.products
      })),
      priceRange: {
        min: priceStats._min.price || 0,
        max: priceStats._max.price || 0
      },
      attributes: attributesWithValues.map(attr => ({
        id: attr.id,
        name: attr.name,
        values: attr.values.map(val => ({
          id: val.id,
          value: val.value,
          count: val._count.variants
        }))
      }))
    };
  } catch (error) {
    console.error('Error getting available filters:', error);
    return {
      categories: [],
      priceRange: { min: 0, max: 0 },
      attributes: []
    };
  }
};

// Función para búsqueda rápida (autocompletado)
export const getSearchSuggestions = async (query: string, limit: number = 5) => {
  const validation = validateSearchTerm(query);
  
  if (!validation.isValid) {
    return [];
  }

  const normalizedQuery = normalizeSearchText(validation.cleanTerm);

  try {
    const products = await prisma.product.findMany({
      where: {
        isEnabled: true,
        OR: [
          {
            title: {
              contains: normalizedQuery,
              mode: 'insensitive'
            }
          },
          {
            tags: {
              has: normalizedQuery
            }
          }
        ]
      },
      select: {
        id: true,
        title: true,
        slug: true,
        ProductImage: {
          take: 1,
          select: { url: true }
        }
      },
      take: limit
    });

    return products.map(product => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      image: product.ProductImage[0]?.url || '/imgs/placeholder.jpg'
    }));
  } catch (error) {
    console.error('Error in getSearchSuggestions:', error);
    return [];
  }
};