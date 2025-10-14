'use server'
import prisma from "@/lib/prisma";

export const getAllEnabledCategories = async () => {
    try {
        const categories = await prisma.category.findMany({
            where: {
                isEnabled: true
            },
            include: {
                subcategories: {
                    where: { isEnabled: true },
                    include: {
                        subcategories: { where: { isEnabled: true } }
                    }
                }
            }
        });

        return {
            ok: true,
            categories
        };
    } catch (error) {
        return {
            ok: false,
            error: 'Failed to fetch categories'
        };
    }
}
