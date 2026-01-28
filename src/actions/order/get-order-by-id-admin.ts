'use server'

import { auth } from "@/auth.config";
import {prisma} from "@/lib/prisma";


export const getOrderByIdAdmin = async (id: string) => {

    if (!id) {
        return {
            ok: false,
            error: 'Order ID is required'
        }
    }

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

    const order = await prisma.order.findUnique({
        where: {
            id: id,
        },
        include: {
            OrderItem: {
                include: {
                    product: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            ProductImage: {
                                take: 1
                            }
                        }
                    },
                    variant: {
                        select: {
                            id: true,
                            sku: true,
                            price: true,
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
                                    }
                                }
                            }
                        }
                    }
                }
            },
            OrderAddress: {
                include: {
                    country: {
                        select: {
                            name: true,
                            id: true
                        }
                    }
                }
            }
        }
    });

    if (!order) {
        return {
            ok: false,
            error: 'Order not found'
        }
    }

    return {
        ok: true,
        order
    };

}