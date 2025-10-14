'use server'

import { auth } from "@/auth.config";
import prisma from "@/lib/prisma";

export const getPaginatedAttributes = async (page: number = 1, take: number = 10) => {
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
            error: 'User unauthorized to view all attributes'
        };
    }

    try {
        const attributes = await prisma.attribute.findMany({
            skip: (page - 1) * take,
            take,
            include: {
                values: {
                    select: {
                        id: true,
                        value: true
                    }
                }
            },
            orderBy: { name: 'desc' }
        });

        const totalCount = await prisma.attribute.count({});
        const totalPages = Math.ceil(totalCount / take);

        return {
            ok: true,
            currentPage: page,
            totalPages,
            attributes
        };
    } catch (error) {
        return {
            ok: false,
            error: 'Failed to retrieve attributes'
        };
    }
};
// This function retrieves orders for the authenticated user, with pagination support.
// It returns an object containing the current page, total pages, and the list of orders.
// If the user is not authenticated or an error occurs, it returns an error message.
// The function uses Prisma to interact with the database and includes related data such as order items and addresses.
// The orders are sorted by creation date in descending order, and the function handles pagination by skipping a calculated number of records based on the current page and the number of records to take per page. 