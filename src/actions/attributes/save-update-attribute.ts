'use server'

import {prisma} from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const saveUpdateAttribute = async (data: { id?: string; name: string; values: string[] }) => {
    try {
        if (data.id) {
            // Update existing attribute with safer approach
            await prisma.$transaction(async (tx) => {
                // 1. Actualizar el nombre del atributo
                await tx.attribute.update({
                    where: { id: data.id },
                    data: { name: data.name }
                });

                // 2. Obtener valores actuales y verificar cuáles están en uso
                const currentAttribute = await tx.attribute.findUnique({
                    where: { id: data.id },
                    include: {
                        values: {
                            include: {
                                _count: {
                                    select: {
                                        variants: true
                                    }
                                }
                            }
                        }
                    }
                });

                if (!currentAttribute) {
                    throw new Error('Attribute not found');
                }

                // 3. Identificar valores que se pueden eliminar (no están en uso)
                const valuesInUse = currentAttribute.values.filter(v => v._count.variants > 0);
                const valuesNotInUse = currentAttribute.values.filter(v => v._count.variants === 0);
                
                console.log('📊 Values analysis:');
                console.log('  - Values in use:', valuesInUse.map(v => v.value));
                console.log('  - Values not in use:', valuesNotInUse.map(v => v.value));
                console.log('  - New values to add:', data.values);

                // 4. Eliminar solo los valores que NO están en uso
                if (valuesNotInUse.length > 0) {
                    await tx.attributeValue.deleteMany({
                        where: {
                            id: {
                                in: valuesNotInUse.map(v => v.id)
                            }
                        }
                    });
                    console.log('🗑️ Deleted unused values:', valuesNotInUse.map(v => v.value));
                }

                // 5. Identificar valores existentes que se deben mantener
                const existingValues = currentAttribute.values.map(v => v.value);
                const valuesToKeep = data.values.filter(value => existingValues.includes(value));
                const newValues = data.values.filter(value => !existingValues.includes(value));

                console.log('  - Values to keep:', valuesToKeep);
                console.log('  - New values to create:', newValues);

                // 6. Crear solo los valores nuevos
                if (newValues.length > 0) {
                    await tx.attributeValue.createMany({
                        data: newValues.map(value => ({
                            attributeId: data.id!,
                            value
                        }))
                    });
                    console.log('✅ Created new values:', newValues);
                }

                // 7. Si hay valores en uso que no están en la nueva lista, mostrar advertencia
                const valuesInUseNotInNewList = valuesInUse.filter(v => !data.values.includes(v.value));
                if (valuesInUseNotInNewList.length > 0) {
                    console.warn('⚠️ Warning: These values are in use but not in new list:', valuesInUseNotInNewList.map(v => v.value));
                }
            });

            revalidatePath('/admin/attributes');
            
            // Obtener el atributo actualizado
            const updatedAttribute = await prisma.attribute.findUnique({
                where: { id: data.id },
                include: { values: true }
            });

            return {
                ok: true,
                attribute: updatedAttribute,
                warning: null
            };
        } else {
            // Create new attribute (sin cambios)
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
        console.error('💥 Error in saveUpdateAttribute:', error);
        return {
            ok: false,
            error: error instanceof Error ? error.message : 'Failed to save or update attribute',
        };
    }
};

// Función helper para verificar uso de valores de atributos
export const checkAttributeValueUsage = async (attributeId: string) => {
    try {
        const attribute = await prisma.attribute.findUnique({
            where: { id: attributeId },
            include: {
                values: {
                    include: {
                        _count: {
                            select: {
                                variants: true
                            }
                        },
                        variants: {
                            select: {
                                variant: {
                                    select: {
                                        product: {
                                            select: {
                                                title: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        return {
            ok: true,
            valuesInUse: attribute?.values.filter(v => v._count.variants > 0) || [],
            valuesNotInUse: attribute?.values.filter(v => v._count.variants === 0) || []
        };
    } catch (error) {
        return {
            ok: false,
            error: 'Failed to check attribute usage'
        };
    }
};