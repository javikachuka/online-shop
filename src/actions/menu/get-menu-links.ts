
'use server'

import {prisma} from "@/lib/prisma";  

export const getMenuLinks = async () => {
    try {
        const enabledCategories = await prisma.category.findMany({
            where: { isEnabled: true },
            orderBy: { name: 'asc' }
        });

        type MenuCategoryNode = (typeof enabledCategories)[number] & {
            subcategories: MenuCategoryNode[];
        };

        const groupedByParent = enabledCategories.reduce<Record<string, typeof enabledCategories>>((acc, category) => {
            const key = category.parentId ?? 'root';
            if (!acc[key]) {
                acc[key] = [];
            }

            acc[key].push(category);
            return acc;
        }, {});

        const buildTree = (parentId: string | null): MenuCategoryNode[] => {
            const key = parentId ?? 'root';
            const children = groupedByParent[key] ?? [];

            return children.map((category) => ({
                ...category,
                subcategories: buildTree(category.id)
            }));
        };

        const menuLinks = buildTree(null);

        return {
            ok: true,
            data: menuLinks
        };
    } catch (error) {
        return {
            ok: false,
            error: 'Error fetching menu links'
        };
    }
}