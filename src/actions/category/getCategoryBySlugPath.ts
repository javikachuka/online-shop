import {prisma} from "@/lib/prisma";

export const getCategoryBySlugPath = async (slugArray: string[]) => {
  if (!slugArray.length) return null;
  let parentId: string | null = null;
  let category = null;

  for (const slug of slugArray) {
    category = await prisma.category.findFirst({
      where: {
        slug,
        isEnabled: true,
        parentId: parentId,
      },
    });
    if (!category) return null;
    parentId = category.id;
  }
  return category;
};
