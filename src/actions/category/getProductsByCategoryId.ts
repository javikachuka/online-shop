import {prisma} from "@/lib/prisma";

interface GetProductsByCategoryIdParams {
  id: string;
  page?: number;
  pageSize?: number;
}

export const getProductsByCategoryId = async ({ id, page = 1, pageSize = 12 }: GetProductsByCategoryIdParams) => {
  try {
    // Busca los productos relacionados a la categoría
    const totalProducts = await prisma.product.count({
      where: {
        categories: {
          some: { categoryId: id }
        },
        isEnabled: true
      }
    });
    const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
    const skip = (page - 1) * pageSize;

    const products = await prisma.product.findMany({
      where: {
        isEnabled: true,
        categories: {
          some: { categoryId: id }
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
