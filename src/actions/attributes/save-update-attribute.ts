'use server'

import {prisma} from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const saveUpdateAttribute = async (data: { id?: string; name: string; values: string[] }) => {
    try {
        if (data.id) {
            // Update existing attribute
            const updatedAttribute = await prisma.attribute.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    values: {
                        // Delete existing values and create new ones
                        deleteMany: {},
                        create: data.values.map(value => ({ value })),
                    },
                },
                include: {
                    values: true,
                },
            });
            revalidatePath('/admin/attributes');
            return {
                ok: true,
                attribute: updatedAttribute,
            };
        } else {
            // Create new attribute
            const newAttribute = await prisma.attribute.create({
                data: {
                    name: data.name,
                    values: {
                        create: data.values.map(value => ({ value })),
                    },
                },
                include: {
                    values: true,
                },
            });
            revalidatePath('/admin/attributes');
            return {
                ok: true,
                attribute: newAttribute,
            };
        }
        
    } catch (error) {
        return {
            ok: false,
            error: 'Failed to save or update attribute',
        };
    }
};