'use server'

import {prisma} from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const saveOrUpdateCategory = async ({ id, name, slug, description, parentId, isEnabled }: {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  isEnabled?: boolean;
}) => {
  try {
    if (id) {
      // Update existing category
      const category = await prisma.category.update({
        where: { id },
        data: {
          name,
          slug,
          description,
          parentId: parentId || null,
          isEnabled: isEnabled ?? true,
        },
      });
      return { ok: true, category };
    } else {
      // Create new category
      const category = await prisma.category.create({
        data: {
          name,
          slug,
          description,
          parentId: parentId || null,
          isEnabled: isEnabled ?? true,
        },
      });
      revalidatePath('/admin/categorias');
      return { ok: true, category };
    }
  } catch (error) {
    console.log(error);
    
    return { ok: false, error: 'Error saving/updating category' };
  }
};
