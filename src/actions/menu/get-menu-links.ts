
'use server'

import prisma from "@/lib/prisma";  

export const getMenuLinks = async () => {
    try {
        const menuLinks = await prisma.category.findMany({
            where: { isEnabled: true, parentId: null },
            orderBy: { name: 'asc' },
            include: {
                subcategories: {
                    where: { isEnabled: true },
                    include: {
                        subcategories: {
                            where: { isEnabled: true }
                        }
                    }
                }
            }
        });

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