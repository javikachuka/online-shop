'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const addAttributeValue = async (attributeId: string, value: string) => {
    try {
        const trimmedValue = value.trim();

        if (!attributeId) {
            return { ok: false, error: 'Debes indicar el atributo.' };
        }
        if (!trimmedValue) {
            return { ok: false, error: 'El valor no puede estar vacío.' };
        }

        const attribute = await prisma.attribute.findUnique({
            where: { id: attributeId },
            include: { values: true },
        });

        if (!attribute) {
            return { ok: false, error: 'El atributo no existe.' };
        }

        const alreadyExists = attribute.values.some(
            (v) => v.value.toLowerCase() === trimmedValue.toLowerCase()
        );
        if (alreadyExists) {
            return { ok: false, error: 'Ese valor ya existe para este atributo.' };
        }

        const newValue = await prisma.attributeValue.create({
            data: {
                attributeId,
                value: trimmedValue,
            },
        });

        revalidatePath('/admin/attributes');
        revalidatePath('/admin/product');

        return { ok: true, value: newValue };
    } catch (error) {
        console.error('Error in addAttributeValue:', error);
        return {
            ok: false,
            error: error instanceof Error ? error.message : 'Error al crear el valor del atributo',
        };
    }
};
