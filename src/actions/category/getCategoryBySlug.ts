import {prisma} from "@/lib/prisma";

export const getCategoryBySlug = async (slug: string) => {
  try {
    const category = await prisma.category.findFirst({
      where: { slug, isEnabled: true },
      include: {
        subcategories: {
          where: { isEnabled: true },
          include: {
            subcategories: { where: { isEnabled: true } }
          }
        }
      }
    });
    return category;
  } catch (error) {
    return null;
  }
};
