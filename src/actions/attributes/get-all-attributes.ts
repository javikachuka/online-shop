'use server'
import {prisma} from "@/lib/prisma";

export const getAllAtributes = async () => {
    try {
        const attributes = await prisma.attribute.findMany({
            include: {
                values: {
                    select: {
                        id: true,
                        value: true,
                        attributeId: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return {
            ok: true,
            attributes
        };
    } catch (error) {
        return {
            ok: false,
            error: 'Failed to fetch attributes'
        };
    }
}
