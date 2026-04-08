'use server'

import { auth } from "@/auth.config";
import {prisma} from "@/lib/prisma";


export const getOrderById = async (id: string) => {

    if (!id) {
        return {
            ok: false,
            error: 'Order ID is required'
        }
    }

    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        return {
            ok: false,
            error: 'User not authenticated'
        }
    }

    const order = await prisma.order.findUnique({
        where: {
            id: id,
            userId: userId
        },
        include: {
            OrderItem: {
                include: {
                    product: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            imageGroupingAttributeId: true,
                            ProductImage: {
                                select: {
                                    id: true,
                                    url: true,
                                    variants: {
                                        select: {
                                            id: true,
                                            attributes: {
                                                select: {
                                                    attributeId: true,
                                                    value: {
                                                        select: { value: true }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
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
                                    attribute: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    },
                                    valueId: true
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
            },
            paymentMethod: {}
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