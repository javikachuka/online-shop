'use server'
import prisma from "@/lib/prisma";

export const getAttributeById = async (id: string) => {
    try {
        const attribute = await prisma.attribute.findFirst({
            where: { id: id },
            include: {
                values: {
                    select: {
                        id: true,
                        value: true,
                        attributeId: true
                    }
                }
            },
        });

        return {
            ok: true,
            attribute
        };
    } catch (error) {
        return {
            ok: false,
            error: 'Failed to fetch attribute'
        };
    }
}
