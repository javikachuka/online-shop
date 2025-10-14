'use server'

import { auth } from "@/auth.config";
import prisma from "@/lib/prisma";

export const getOrdersByUser = async (page: number = 1, take: number = 10) => {
    if (isNaN(Number(page)) || page < 1) page = 1;
    if (isNaN(Number(take)) || take < 1) take = 10;

    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        return {
            ok: false,
            error: 'User not authenticated'
        };
    }

    try {
        const orders = await prisma.order.findMany({
            where: { userId },
            skip: (page - 1) * take,
            take,
            include: {
                OrderAddress: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const totalCount = await prisma.order.count({ where: { userId } });
        const totalPages = Math.ceil(totalCount / take);

        return {
            ok: true,
            currentPage: page,
            totalPages,
            orders
        };
    } catch (error) {
        return {
            ok: false,
            error: 'Failed to retrieve orders'
        };
    }
};
// This function retrieves orders for the authenticated user, with pagination support.
// It returns an object containing the current page, total pages, and the list of orders.
// If the user is not authenticated or an error occurs, it returns an error message.
// The function uses Prisma to interact with the database and includes related data such as order items and addresses.
// The orders are sorted by creation date in descending order, and the function handles pagination by skipping a calculated number of records based on the current page and the number of records to take per page. 