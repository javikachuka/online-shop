import {prisma} from "@/lib/prisma";

interface GetProductsByCategorySlugParams {
  slug: string;
  page?: number;
  pageSize?: number;
}

export const getProductsByCategorySlug = async ({ slug, page = 1, pageSize = 12 }: GetProductsByCategorySlugParams) => {
  try {
    // Busca la categoría por slug
    const category = await prisma.category.findFirst({
      where: { slug, isEnabled: true },
      select: { id: true }
    });
    if (!category) return { products: [], currentPage: 1, totalPages: 1 };

    // Busca los productos relacionados a la categoría
    const totalProducts = await prisma.product.count({
      where: {
        categories: {
          some: { categoryId: category.id }
        }
      }
    });
    const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
    const skip = (page - 1) * pageSize;

    const products = await prisma.product.findMany({
      where: {
        categories: {
          some: { categoryId: category.id }
        }
      },
      include: {
        ProductImage: true,
        variants: {
            include: {
                attributes: {
                select: {
                    id: true,
                    attribute: true,
                    value: true,
                    attributeId: true,
                    valueId: true
                }
                }
            },
            orderBy: {
                order: 'asc'
            }
        }
      },
      skip,
      take: pageSize,
      orderBy: { title: 'asc' }
    });

    return {
      products,
      currentPage: page,
      totalPages
    };
  } catch (error) {
    return { products: [], currentPage: 1, totalPages: 1 };
  }
};
