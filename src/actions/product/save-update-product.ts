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
    

    // Campos simples
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    slug.toLocaleLowerCase().replace(/ /g, '-').trim();
    const description = formData.get("description") as string;
    const tags = formData.get("tags") as string;
    const diffPrice = formData.get("diffPrice") === "true";
    const isEnabled = formData.get("isEnabled") === "true";
    // Arrays y JSON
    const categories = formData.getAll("categories[]") as string[];
    const variants = JSON.parse(formData.get("variants") as string);
    
    // Imágenes nuevas
    const newImages = formData.getAll("newImages") as File[];
    const imagesToDelete = formData.getAll("imagesToDelete[]") as string[];

    // Crear producto (puedes adaptar para update si recibes un id)
    const id = formData.get("id") as string | null;
    try {
        const prismaTx = await prisma.$transaction(async (tx) => {
    
            let product;
    
            if(id){
                // Actualizar producto existente
                // 1. Obtener variantes actuales
                const dbVariants = await tx.productVariant.findMany({
                    where: { productId: id },
                    include: { attributes: true }
                });

                // 2. Actualizar, crear o eliminar variantes
                // a) Eliminar variantes que ya no están en el formulario
                const incomingVariantIds = (variants as any[]).map((v: any) => v.id).filter(Boolean);
                const variantsToDelete = dbVariants.filter(v => !incomingVariantIds.includes(v.id));
                
                for(const v of variantsToDelete){
                    await tx.productVariantAttribute.deleteMany({ where: { variantId: v.id } });
                    await tx.productVariant.delete({ where: { id: v.id } });
                }

                // b) Actualizar o crear variantes
                for(const variant of variants as any[]){
                    
                    if(variant.id){
                        // Actualizar variante existente
                        await tx.productVariant.update({
                            where: { id: variant.id },
                            data: {
                                price: Number(variant.price),
                                stock: Number(variant.stock),
                                sku: variant.sku,
                                discountPercent: Number(variant.discountPercent || 0),
                                // Actualizar atributos
                                attributes: {
                                    // Upsert atributos
                                    upsert: (variant.attributes as any[]).map((attr: any) => ({
                                        where: {
                                            id: attr.id
                                        },
                                        update: {
                                            valueId: attr.valueId
                                        },
                                        create: {
                                            attributeId: attr.attributeId,
                                            valueId: attr.valueId
                                        }
                                    }))
                                }
                            }
                        });
                        
                    }else{
                        // Crear nueva variante
                        await tx.productVariant.create({
                            data: {
                                productId: id,
                                price: Number(variant.price),
                                stock: Number(variant.stock),
                                sku: variant.sku,
                                discountPercent: Number(variant.discountPercent || 0),
                                attributes: {
                                    create: (variant.attributes as any[]).map((attr: any) => ({
                                        attributeId: attr.attributeId,
                                        valueId: attr.valueId
                                    }))
                                }
                            }
                        });
                    }
                }
                
                // Actualizar datos principales del producto
                product = await tx.product.update({
                    where: { id },
                    data: {
                        title,
                        slug,
                        description,
                        tags: tags.split(",").map(t => t.trim()),
                        diffPrice,
                        isEnabled
                    }
                });
                // Actualizar categorías (N:M)
                await tx.productCategory.deleteMany({ where: { productId: id } });
                await tx.productCategory.createMany({
                    data: categories.map(categoryId => ({
                        productId: id,
                        categoryId
                    })),
                    skipDuplicates: true
                });
    
            }else{
                // Crear nuevo producto
                product = await tx.product.create({
                    data: {
                        title,
                        slug,
                        description,
                        tags: tags.split(",").map(t => t.trim()),
                        diffPrice,
                        isEnabled,
                        categories: {
                            create: categories.map(categoryId => ({
                                category: { connect: { id: categoryId } }
                            }))
                        },
                        // ProductImage: {
                        //     create: imageUrls.map((url: string) => ({ url }))
                        // },
                        variants: {
                            create: (variants as any[]).map((variant: any) => ({
                                price: Number(variant.price),
                                stock: Number(variant.stock),
                                sku: variant.sku,
                                discountPercent: Number(variant.discountPercent || 0),
                                attributes: {
                                    create: (variant.attributes as any[]).map((attr: any) => ({
                                        attributeId: attr.attributeId,
                                        valueId: attr.valueId
                                    }))
                                }
                            }))
                        }
                    }
                });
            }

            return {
                product
            }
        });

        // --- CARGA Y BORRADO DE IMÁGENES (aislado de la transacción principal) ---
        let imageError = null;
        let imageUrls: string[] = [];
        // Cargar nuevas imágenes
        if (newImages.length > 0) {
            try {
                imageUrls = await uploadImages(newImages) as string[];
                // Guardar URLs en la base de datos
                for (const url of imageUrls) {
                    await prisma.productImage.create({
                        data: {
                            productId: prismaTx.product.id,
                            url
                        }
                    });
                }
            } catch (err) {
                imageError = 'Hubo un error al cargar las imagenes en Cloudinary.';
            }
        }
        // Borrar imágenes marcadas para eliminar
        if (imagesToDelete.length > 0) {
            try {
                // Buscar las urls de las imágenes a eliminar
                const images = await prisma.productImage.findMany({
                    where: { id: { in: imagesToDelete } },
                    select: { id: true, url: true }
                });
                let cloudinaryError = false;
                // Primero borrar de Cloudinary si corresponde
                for (const image of images) {
                    if (image.url && image.url.includes('cloudinary.com')) {
                        const matches = image.url.match(/\/images\/ava_indumentaria\/(.*)\.[a-zA-Z0-9]+$/);
                        const publicId = matches ? `images/ava_indumentaria/${matches[1]}` : null;
                        if (publicId) {
                            try {
                                await cloudinary.uploader.destroy(publicId);
                            } catch (err) {
                                cloudinaryError = true;
                                console.log('Error deleting image from Cloudinary:', err);
                            }
                        }
                    }
                }
                // Solo borrar de la base si no hubo error en Cloudinary
                if (!cloudinaryError) {
                    await prisma.productImage.deleteMany({
                        where: { id: { in: imagesToDelete } }
                    });
                } else {
                    imageError = 'Hubo un error borrando imagenes de Cloudinary. No se eliminaron referencias en la base.';
                }
            } catch (err) {
                imageError = 'Hubo un error borrando imagenes de Cloudinary.';
            }
        }

        // Revalida la ruta del producto para mostrar cambios
        revalidatePath(`/admin/products`);
        revalidatePath(`/admin/product/${slug}`);
        revalidatePath(`/products/${slug}`);

        return {
            ok: true,
            product: prismaTx.product,
            imageError
        };
    } catch (error) {
        console.log(error);
        
        return {
            ok: false,
            error: 'Error saving/updating product'
        }
    }

}