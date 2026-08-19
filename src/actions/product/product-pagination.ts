'use server'

import {prisma} from "@/lib/prisma"
import { withDbRetry } from "@/lib/db-retry"


interface PaginationOptions {
    page?: number;
    take?: number;

}

export const getPaginatedProductsWithImages = async ({page = 1, take = 12}: PaginationOptions) => {

    if(isNaN(Number(page))) page = 1;
    if(page < 1 ) page = 1;



    try {
        const products = await withDbRetry(() => prisma.product.findMany({
            take: take,
            skip: (page - 1) * take,
            where: {
                isEnabled: true
            },
            orderBy: [
                { createdAt: 'desc' },
                { title: 'asc' }
            ],
            include:{
                ProductImage:{
                    orderBy: {
                        sortOrder: 'asc'
                    },
                    take: 2,
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
                                attribute: true,
                                value: true,
                                attributeId: true,
                                valueId: true
                            }
                        }
                    },
                    orderBy: {
                        order: 'asc'
                    }
                }
            },
        }))

        const totalCount = await withDbRetry(() => prisma.product.count({
            where: {isEnabled: true}
        }))

        const totalPages = Math.ceil(totalCount / take)

        return {
            currentPage: page,
            totalPages: totalPages,
            products
        }
        
        
    } catch (error) {
        throw new Error('no se pudo recuperar los productos')
    }
}