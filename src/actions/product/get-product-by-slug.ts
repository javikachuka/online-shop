'use server'

import {prisma} from "@/lib/prisma";

export const getProductBySlug = async (slug: string) => {

    try {

        const product = await prisma.product.findFirst({
            include: {
                ProductImage: {
                    select:{
                        id: true,
                        url: true
                    }
                },
                variants: {
                    include: {
                        attributes: {
                            select: {
                                id: true,
                                value: true,
                                attributeId: true,
                                valueId: true,
                                attribute: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                },
                            }
                        }
                    },
                    orderBy: {
                        order: 'asc'
                    }
                },
                categories: {
                    select: {
                        categoryId: true,
                    }
                }
            },
            where: {
                slug: slug
            }
        })

        if(!product) return null

        return {
            ...product
        }
        
    } catch (error) {

        console.log(error);
        throw new Error('Error al obtener el producto')
        
    }
}