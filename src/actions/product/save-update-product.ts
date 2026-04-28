'use server'

import {prisma} from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth.config";
import { v2 as cloudinary } from 'cloudinary'
import { StockMovementType } from "@prisma/client";
cloudinary.config(process.env.CLOUDINARY_URL || "");

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    

export const saveOrUpdateProduct = async (formData: FormData) => {

    const session = await auth();
    const userId = session?.user?.id;
    const role = session?.user?.role;
    if (!userId) {
        return {
            ok: false,
            error: 'User not authenticated'
        }
    }

    if (role !== 'admin') {
        return {
            ok: false,
            error: 'User unauthorized to view orders'
        }
    }
    
    const id = formData.get("id") as string | null;
    const title = formData.get("title") as string;
    const slug = (formData.get("slug") as string).toLowerCase().replace(/ /g, '-').trim();
    const description = formData.get("description") as string;
    const tags = formData.get("tags") as string;
    const diffPrice = formData.get("diffPrice") === "true";
    const isEnabled = formData.get("isEnabled") === "true";

    const rawVisualAttributeId = formData.get("visualAttributeId") as string | null;
    const visualAttributeId = rawVisualAttributeId && rawVisualAttributeId.trim() !== "" ? rawVisualAttributeId : null;

    const categories = formData.getAll("categories[]") as string[];
    const variants = JSON.parse(formData.get("variants") as string);
    const imagesToDelete = formData.getAll("imagesToDelete[]") as string[];
    const existingImageOrderByGroup = JSON.parse(
        (formData.get("existingImageOrderByGroup") as string | null) ?? "{}"
    ) as Record<string, string[]>;

    // --- 1. PROCESAR IMÁGENES DEL FORMDATA ---
    const imageGroups: Record<string, File[]> = {};

    // Convertimos a array para evitar el error de iteración de TS
    Array.from(formData.entries()).forEach(([key, value]) => {
        if (key.startsWith("images_") && value instanceof File) {
            const groupName = key.replace("images_", "");
            if (!imageGroups[groupName]) imageGroups[groupName] = [];
            imageGroups[groupName].push(value);
        }
    });

    const allIncomingImages = Array.from(formData.entries())
        .filter(([key, value]) => (key.startsWith("images_") || key === 'newImages') && value instanceof File)
        .map(([, value]) => value as File);

    for (const file of allIncomingImages) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return {
                ok: false,
                error: `Formato no permitido: ${file.name}. Usa JPG, PNG, WEBP o AVIF.`
            }
        }

        if (file.size > MAX_IMAGE_SIZE_BYTES) {
            return {
                ok: false,
                error: `La imagen ${file.name} supera el máximo de 2MB.`
            }
        }
    }

    try {
        const product = await prisma.$transaction(async (tx) => {
            let currentProduct;

            // --- 2. CREAR O ACTUALIZAR PRODUCTO Y VARIANTES ---
            if (id) {
                // Lógica de Update (Simplificada para foco en imágenes)
                await tx.productCategory.deleteMany({ where: { productId: id } });

                if (categories.length > 0) {
                    await tx.productCategory.createMany({
                        data: categories.map((categoryId) => ({
                            productId: id,
                            categoryId,
                        })),
                        skipDuplicates: true,
                    });
                }

                currentProduct = await tx.product.update({
                    where: { id },
                    data: {
                        title, slug, description, diffPrice, isEnabled,
                        tags: tags.split(",").map(t => t.trim()),
                        imageGroupingAttributeId: visualAttributeId
                    }
                });

                const existingVariants = await tx.productVariant.findMany({
                    where: { productId: id },
                    select: { id: true, stock: true }
                });

                const existingVariantIds = existingVariants.map((v) => v.id);
                const existingVariantStockById = new Map(existingVariants.map((v) => [v.id, v.stock]));
                const incomingVariantIds = variants
                    .map((v: any) => v.id)
                    .filter((variantId: string | undefined) => !!variantId);

                const variantsToDelete = existingVariantIds.filter(
                    (variantId) => !incomingVariantIds.includes(variantId)
                );

                if (variantsToDelete.length > 0) {
                    await tx.productVariantAttribute.deleteMany({
                        where: { variantId: { in: variantsToDelete } }
                    });

                    await tx.productVariant.deleteMany({
                        where: { id: { in: variantsToDelete } }
                    });
                }

                for (const variant of variants) {
                    const variantData = {
                        price: Number(variant.price),
                        sku: variant.sku || null,
                        discountPercent: Number(variant.discountPercent || 0),
                        order: Number(variant.order || 0),
                    };

                    if (variant.id && existingVariantIds.includes(variant.id)) {
                        await tx.productVariant.update({
                            where: { id: variant.id },
                            data: variantData,
                        });

                        // El stock de variantes existentes se gestiona solo por movimientos,
                        // no desde el formulario de edición del producto.
                        if (existingVariantStockById.get(variant.id) === undefined) {
                            throw new Error(`No se encontró la variante existente ${variant.id}`);
                        }

                        const incomingAttributes = (variant.attributes || []).map((attr: any) => ({
                            attributeId: attr.attributeId,
                            valueId: attr.valueId,
                        }));

                        const incomingAttributeIds = incomingAttributes.map((attr: any) => attr.attributeId);

                        if (incomingAttributeIds.length > 0) {
                            await tx.productVariantAttribute.deleteMany({
                                where: {
                                    variantId: variant.id,
                                    attributeId: { notIn: incomingAttributeIds }
                                }
                            });
                        } else {
                            await tx.productVariantAttribute.deleteMany({
                                where: { variantId: variant.id }
                            });
                        }

                        for (const attr of incomingAttributes) {
                            await tx.productVariantAttribute.upsert({
                                where: {
                                    attributeId_variantId: {
                                        attributeId: attr.attributeId,
                                        variantId: variant.id,
                                    }
                                },
                                update: {
                                    valueId: attr.valueId,
                                },
                                create: {
                                    variantId: variant.id,
                                    attributeId: attr.attributeId,
                                    valueId: attr.valueId,
                                }
                            });
                        }
                    } else {
                        const createdVariant = await tx.productVariant.create({
                            data: {
                                ...variantData,
                                stock: Number(variant.stock),
                                productId: id,
                                attributes: {
                                    create: (variant.attributes || []).map((attr: any) => ({
                                        attributeId: attr.attributeId,
                                        valueId: attr.valueId
                                    }))
                                }
                            }
                        });

                        if (Number(variant.stock) !== 0) {
                            await tx.stockMovement.create({
                                data: {
                                    variantId: createdVariant.id,
                                    type: StockMovementType.INITIAL,
                                    quantity: Number(variant.stock),
                                    stockBefore: 0,
                                    stockAfter: Number(variant.stock),
                                    reason: 'Initial stock for new variant',
                                    actorUserId: userId,
                                }
                            });
                        }
                    }
                }
            } else {
                // Crear Producto
                currentProduct = await tx.product.create({
                    data: {
                        title, slug, description, diffPrice, isEnabled,
                        tags: tags.split(",").map(t => t.trim()),
                        imageGroupingAttributeId: visualAttributeId,
                        categories: {
                            create: categories.map(catId => ({ categoryId: catId }))
                        }
                    }
                });

                for (const variant of variants) {
                    const initialStock = Number(variant.stock);
                    const createdVariant = await tx.productVariant.create({
                        data: {
                            price: Number(variant.price),
                            stock: initialStock,
                            sku: variant.sku || null,
                            discountPercent: Number(variant.discountPercent || 0),
                            order: Number(variant.order || 0),
                            productId: currentProduct.id,
                            attributes: {
                                create: (variant.attributes || []).map((attr: any) => ({
                                    attributeId: attr.attributeId,
                                    valueId: attr.valueId
                                }))
                            }
                        }
                    });

                    if (initialStock !== 0) {
                        await tx.stockMovement.create({
                            data: {
                                variantId: createdVariant.id,
                                type: StockMovementType.INITIAL,
                                quantity: initialStock,
                                stockBefore: 0,
                                stockAfter: initialStock,
                                reason: 'Initial stock for product creation',
                                actorUserId: userId,
                            }
                        });
                    }
                }
            }

            const groupVariantIdsCache = new Map<string, string[]>();

            const getVariantIdsForGroup = async (groupName: string) => {
                if (groupName === "General" || !visualAttributeId) {
                    return [] as string[];
                }

                if (groupVariantIdsCache.has(groupName)) {
                    return groupVariantIdsCache.get(groupName)!;
                }

                const variantsInGroup = await tx.productVariant.findMany({
                    where: {
                        productId: currentProduct.id,
                        attributes: {
                            some: {
                                attributeId: visualAttributeId,
                                value: { value: groupName }
                            }
                        }
                    },
                    select: { id: true }
                });

                const variantIds = variantsInGroup.map((variant) => variant.id);
                groupVariantIdsCache.set(groupName, variantIds);
                return variantIds;
            };

            const getExistingImageIdsForGroup = async (groupName: string) => {
                const explicitOrder = (existingImageOrderByGroup[groupName] ?? []).filter(
                    (imageId) => !imagesToDelete.includes(imageId)
                );

                if (explicitOrder.length > 0) {
                    return explicitOrder;
                }

                if (groupName === "General" || !visualAttributeId) {
                    const generalImages = await tx.productImage.findMany({
                        where: {
                            productId: currentProduct.id,
                            id: { notIn: imagesToDelete },
                            variantAssignments: {
                                none: {}
                            }
                        },
                        orderBy: {
                            sortOrder: 'asc'
                        },
                        select: { id: true }
                    });

                    return generalImages.map((image) => image.id);
                }

                const variantIds = await getVariantIdsForGroup(groupName);
                if (variantIds.length === 0) {
                    return [] as string[];
                }

                const assignments = await tx.productImageVariant.findMany({
                    where: {
                        variantId: { in: variantIds },
                        image: {
                            productId: currentProduct.id,
                            id: { notIn: imagesToDelete }
                        }
                    },
                    orderBy: [
                        { sortOrder: 'asc' },
                        { image: { sortOrder: 'asc' } }
                    ],
                    select: { imageId: true }
                });

                return Array.from(new Set(assignments.map((assignment) => assignment.imageId)));
            };

            for (const [groupName, orderedImageIds] of Object.entries(existingImageOrderByGroup)) {
                const imageIds = orderedImageIds.filter((imageId) => !imagesToDelete.includes(imageId));

                if (groupName === "General" || !visualAttributeId) {
                    for (let index = 0; index < imageIds.length; index++) {
                        const imageId = imageIds[index];

                        await tx.productImage.updateMany({
                            where: {
                                id: imageId,
                                productId: currentProduct.id,
                            },
                            data: {
                                sortOrder: index,
                            }
                        });
                    }

                    continue;
                }

                const variantIds = await getVariantIdsForGroup(groupName);
                if (variantIds.length === 0) continue;

                for (let index = 0; index < imageIds.length; index++) {
                    const imageId = imageIds[index];

                    await tx.productImageVariant.updateMany({
                        where: {
                            imageId,
                            variantId: { in: variantIds }
                        },
                        data: {
                            sortOrder: index,
                        }
                    });
                }
            }

            const productImageAggregate = await tx.productImage.aggregate({
                where: {
                    productId: currentProduct.id,
                    id: { notIn: imagesToDelete }
                },
                _max: {
                    sortOrder: true
                }
            });

            let nextGlobalSortOrder = (productImageAggregate._max.sortOrder ?? -1) + 1;

            // --- 3. SUBIDA Y VINCULACIÓN DE IMÁGENES ---
            for (const [groupName, files] of Object.entries(imageGroups)) {
                const existingImageIdsForGroup = await getExistingImageIdsForGroup(groupName);
                const groupSortOffset = existingImageIdsForGroup.length;

                // Subir a Cloudinary (Usa tu función helper actual)
                // const imageUrls = await uploadImages(files); 
                
                // Ejemplo manual de subida si no tienes el helper a mano:
                const uploadPromises = files.map(async (file) => {
                    const buffer = await file.arrayBuffer();
                    const base64Image = Buffer.from(buffer).toString('base64');
                    return cloudinary.uploader.upload(`data:${file.type};base64,${base64Image}`, {
                        folder: 'tu_carpeta_productos',
                        resource_type: 'image',
                        transformation: [
                            { fetch_format: 'auto', quality: 'auto' },
                            { width: 2000, crop: 'limit' }
                        ]
                    });
                });
                
                const uploadResults = await Promise.all(uploadPromises);

                const variantIdsInGroup = await getVariantIdsForGroup(groupName);

                for (let index = 0; index < uploadResults.length; index++) {
                    const res = uploadResults[index];

                    // Creamos el registro de ProductImage
                    const newImage = await tx.productImage.create({
                        data: {
                            url: res.secure_url,
                            productId: currentProduct.id,
                            sortOrder: nextGlobalSortOrder++,
                        }
                    });

                    // Si la imagen pertenece a un grupo visual (ej: "Blanco")
                    if (groupName !== "General" && visualAttributeId && variantIdsInGroup.length > 0) {
                        await tx.productImageVariant.createMany({
                            data: variantIdsInGroup.map((variantId) => ({
                                imageId: newImage.id,
                                variantId,
                                sortOrder: groupSortOffset + index,
                            })),
                            skipDuplicates: true,
                        });
                        }
                }
            }

            // --- 4. BORRADO DE IMÁGENES ---
            if (imagesToDelete.length > 0) {
                // Aquí ejecutas tu lógica de cloudinary.uploader.destroy
                // y luego tx.productImage.deleteMany
                await tx.productImage.deleteMany({
                    where: { id: { in: imagesToDelete as string[] } }
                });
            }

            return currentProduct;
        }, {
            timeout: 20000 // Aumentamos el timeout por la subida de imágenes
        });

        revalidatePath(`/admin/products`);
        revalidatePath(`/product/${slug}`);

        return { ok: true, product };

    } catch (error) {
        console.error(error);
        return { ok: false, error: 'No se pudo salvar el producto. Revisa los logs.' };
    }

}