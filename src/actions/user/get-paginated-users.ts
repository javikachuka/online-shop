'use server'

import { auth } from "@/auth.config";
import {prisma} from "@/lib/prisma";


export const getPaginatedUsers = async (page: number = 1, take: number = 10) => {
    if (isNaN(Number(page)) || page < 1) page = 1;
    if (isNaN(Number(take)) || take < 1) take = 10;

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

    const users = await prisma.user.findMany({
        skip: (page - 1) * take,
        take,
        orderBy: {
            lastName: 'desc'
        }
    });
    const totalCount = await prisma.user.count();
    const totalPages = Math.ceil(totalCount / take);

    if (!users) {
        return {
            ok: false,
            error: 'Users not found'
        }
    }

    return {
        ok: true,
        users,
        currentPage: page,
        totalPages
    };

}