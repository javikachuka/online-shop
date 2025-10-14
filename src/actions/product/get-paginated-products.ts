'use server'

import { auth } from "@/auth.config";
import prisma from "@/lib/prisma";

export const getPaginatedProducts = async (page: number = 1, take: number = 10) => {
    if (isNaN(Number(page)) || page < 1) page = 1;
    if (isNaN(Number(take)) || take < 1) take = 10;

    const session = await auth();
    const userId = session?.user?.id;
    const role = session?.user?.role;
    if (!userId) {
        return {
            ok: false,
            error: 'User not authenticated'
        };
    }
    if (role !== 'admin') {
        return {
            ok: false,
            error: 'User unauthorized to view all products'
        };
    }

    try {
        const products = await prisma.product.findMany({
            skip: (page - 1) * take,
            take,
            include: {
                ProductImage: {
                    take: 1
                },
                variants: {
                    select: {
                        id: true,
                        sku: true,
                        price: true,
                        stock: true
                    }
                },
                categories: {
                    include: {
                        category: true
                    }
                }
            },
            orderBy: { title: 'asc' }
        });

        const totalCount = await prisma.product.count({});
        const totalPages = Math.ceil(totalCount / take);

        return {
            ok: true,
            currentPage: page,
            totalPages,
            products
        };
    } catch (error) {
        console.log(error);
        
        return {
            ok: false,
            error: 'Failed to retrieve products'
        };
    }
};
// This function retrieves orders for the authenticated user, with pagination support.
// It returns an object containing the current page, total pages, and the list of orders.
// If the user is not authenticated or an error occurs, it returns an error message.
// The function uses Prisma to interact with the database and includes related data such as order items and addresses.
// The orders are sorted by creation date in descending order, and the function handles pagination by skipping a calculated number of records based on the current page and the number of records to take per page. 