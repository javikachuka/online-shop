'use server'

import {prisma} from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth.config";
import {z} from 'zod'
import { v2 as cloudinary } from 'cloudinary'
cloudinary.config(process.env.CLOUDINARY_URL || "");

// Utilidad para guardar imagen en disco
async function saveImage(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(process.cwd(), "public/imgs/products", filename);
    await fs.writeFile(filepath, buffer as unknown as Uint8Array);
    return `/imgs/products/${filename}`;
}

const uploadImages = async (files: File[]) => {
    try {
        const uploadPromises = files.map( async (file) => {
            try {
                const buffer = await file.arrayBuffer();
                const base64Image = Buffer.from(buffer).toString('base64');
                return cloudinary.uploader.upload(`data:${file.type};base64,${base64Image}`, {
                    folder: 'images/ava_indumentaria'
                }).then(r => r.secure_url);
            } catch (error) {
                console.log(error);
                return null;
            }
        });
        const uploadResults = await Promise.all(uploadPromises);
        return uploadResults;
        
    } catch (error) {

        console.log(error);
        return null
        
    }
}
    

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
    const visualAttributeId = formData.get("visualAttributeId") as string | null;
    
    const categories = formData.getAll("categories[]") as string[];
    const variants = JSON.parse(formData.get("variants") as string);
    const imagesToDelete = formData.getAll("imagesToDelete[]") as string[];

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

    try {
        const product = await prisma.$transaction(async (tx) => {
            let currentProduct;

            // --- 2. CREAR O ACTUALIZAR PRODUCTO Y VARIANTES ---
            if (id) {
                // Lógica de Update (Simplificada para foco en imágenes)
                await tx.productCategory.deleteMany({ where: { productId: id } });
                currentProduct = await tx.product.update({
                    where: { id },
                    data: {
                        title, slug, description, diffPrice, isEnabled,
                        tags: tags.split(",").map(t => t.trim()),
                    }
                });
            } else {
                // Crear Producto
                currentProduct = await tx.product.create({
                    data: {
                        title, slug, description, diffPrice, isEnabled,
                        tags: tags.split(",").map(t => t.trim()),
                        categories: {
                            create: categories.map(catId => ({ categoryId: catId }))
                        },
                        variants: {
                            create: variants.map((v: any) => ({
                                price: Number(v.price),
                                stock: Number(v.stock),
                                sku: v.sku,
                                discountPercent: Number(v.discountPercent || 0),
                                attributes: {
                                    create: v.attributes.map((attr: any) => ({
                                        attributeId: attr.attributeId,
                                        valueId: attr.valueId
                                    }))
                                }
                            }))
                        }
                    }
                });
            }

            // --- 3. SUBIDA Y VINCULACIÓN DE IMÁGENES ---
            for (const [groupName, files] of Object.entries(imageGroups)) {
                // Subir a Cloudinary (Usa tu función helper actual)
                // const imageUrls = await uploadImages(files); 
                
                // Ejemplo manual de subida si no tienes el helper a mano:
                const uploadPromises = files.map(async (file) => {
                    const buffer = await file.arrayBuffer();
                    const base64Image = Buffer.from(buffer).toString('base64');
                    return cloudinary.uploader.upload(`data:image/png;base64,${base64Image}`, {
                        folder: 'tu_carpeta_productos'
                    });
                });
                
                const uploadResults = await Promise.all(uploadPromises);

                for (const res of uploadResults) {
                    // Creamos el registro de ProductImage
                    const newImage = await tx.productImage.create({
                        data: {
                            url: res.secure_url,
                            productId: currentProduct.id,
                        }
                    });

                    // Si la imagen pertenece a un grupo visual (ej: "Blanco")
                    if (groupName !== "General" && visualAttributeId) {
                        // Buscamos las variantes que acabamos de crear/actualizar 
                        // que coinciden con ese valor de atributo
                        const variantsInGroup = await tx.productVariant.findMany({
                            where: {
                                productId: currentProduct.id,
                                attributes: {
                                    some: {
                                        attributeId: visualAttributeId,
                                        value: { value: groupName }
                                    }
                                }
                            }
                        });

                        // Conectamos la imagen a esas variantes (M:N)
                        if (variantsInGroup.length > 0) {
                            await tx.productImage.update({
                                where: { id: newImage.id },
                                data: {
                                    variants: {
                                        connect: variantsInGroup.map(v => ({ id: v.id }))
                                    }
                                }
                            });
                        }
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