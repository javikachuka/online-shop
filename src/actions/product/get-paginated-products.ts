'use server'

import { auth } from "@/auth.config";
import {prisma} from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const getPaginatedProducts = async (
    page: number = 1,
    take: number = 10,
    query: string = ''
) => {
    if (isNaN(Number(page)) || page < 1) page = 1;
    if (isNaN(Number(take)) || take < 1) take = 10;
    if (take > 100) take = 100;

    const searchTerm = query.trim().slice(0, 100);
    const where: Prisma.ProductWhereInput = searchTerm
        ? {
            OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { slug: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { variants: { some: { sku: { contains: searchTerm, mode: 'insensitive' } } } }
            ]
        }
        : {};

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
            where,
            include: {
                ProductImage: {
                    orderBy: {
                        sortOrder: 'asc'
                    },
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
            orderBy: [
                { createdAt: 'desc' },
                { title: 'asc' }
            ]
        });

        const totalCount = await prisma.product.count({ where });
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