'use server'

import prisma from "@/lib/prisma";

export const getPaginatedCaterories = async (page: number = 1, take: number = 10) => {
    if (isNaN(Number(page)) || page < 1) page = 1;
    if (isNaN(Number(take)) || take < 1) take = 10;

    try {
        const categories = await prisma.category.findMany({
            skip: (page - 1) * take,
            take,
            include: {
                subcategories: true
            },
            orderBy: { name: 'desc' }
        });

        const totalCount = await prisma.category.count({});
        const totalPages = Math.ceil(totalCount / take);

        return {
            ok: true,
            currentPage: page,
            totalPages,
            categories
        };
    } catch (error) {
        return {
            ok: false,
            error: 'Failed to retrieve categories'
        };
    }
};
// This function retrieves orders for the authenticated user, with pagination support.
// It returns an object containing the current page, total pages, and the list of orders.
// If the user is not authenticated or an error occurs, it returns an error message.
// The function uses Prisma to interact with the database and includes related data such as order items and addresses.
// The orders are sorted by creation date in descending order, and the function handles pagination by skipping a calculated number of records based on the current page and the number of records to take per page. 