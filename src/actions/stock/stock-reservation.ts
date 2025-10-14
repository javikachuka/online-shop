'use server'

import prisma from "@/lib/prisma";
import crypto from 'crypto';

export interface ReserveStockItem {
    variantId: string;
    quantity: number;
}

export interface StockReservationResult {
    ok: boolean;
    reservationId?: string;
    error?: string;
    message?: string;
    insufficientStock?: {
        variantId: string;
        requested: number;
        available: number;
        productTitle: string;
    }[];
}

/**
 * Reserva stock temporalmente para un conjunto de productos
 */
export const reserveStock = async (
    userId: string,
    items: ReserveStockItem[],
    reason: string = 'checkout',
    orderKey?: string,
    durationMinutes: number = 15
): Promise<StockReservationResult> => {
    if (!userId || !items.length) {
        return {
            ok: false,
            error: 'User ID and items are required'
        };
    }

    try {
        const reservationId = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

        // Usar transacción para garantizar atomicidad
        const result = await prisma.$transaction(async (tx) => {
            const insufficientStock: any[] = [];

            // 1. Verificar stock disponible para cada item
            for (const item of items) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId },
                    include: {
                        product: {
                            select: {
                                title: true
                            }
                        }
                    }
                });

                if (!variant) {
                    throw new Error(`Variant ${item.variantId} not found`);
                }

                // Calcular stock disponible considerando reservas activas
                const activeReservations = await tx.stockReservation.aggregate({
                    where: {
                        variantId: item.variantId,
                        status: 'ACTIVE',
                        expiresAt: {
                            gt: new Date()
                        }
                    },
                    _sum: {
                        quantity: true
                    }
                });

                const reservedQuantity = activeReservations._sum.quantity || 0;
                const availableStock = variant.stock - reservedQuantity;

                if (availableStock < item.quantity) {
                    insufficientStock.push({
                        variantId: item.variantId,
                        requested: item.quantity,
                        available: availableStock,
                        productTitle: variant.product.title
                    });
                }
            }

            // Si hay productos sin stock suficiente, fallar toda la operación
            if (insufficientStock.length > 0) {
                return {
                    ok: false,
                    error: 'Insufficient stock for some items',
                    insufficientStock
                };
            }

            // 2. Crear las reservas
            const reservations = items.map(item => ({
                reservationId,
                variantId: item.variantId,
                quantity: item.quantity,
                userId,
                status: 'ACTIVE' as const,
                reason,
                orderKey,
                expiresAt
            }));

            await tx.stockReservation.createMany({
                data: reservations
            });

            return {
                ok: true,
                reservationId,
                message: `Stock reserved for ${durationMinutes} minutes`
            };
        });

        return result;

    } catch (error) {
        console.error('Error reserving stock:', error);
        return {
            ok: false,
            error: 'Failed to reserve stock'
        };
    }
};

/**
 * Completa una reserva de stock (cuando se confirma la compra)
 */
export const completeStockReservation = async (
    reservationId: string
): Promise<{ ok: boolean; error?: string }> => {
    try {
        const result = await prisma.stockReservation.updateMany({
            where: {
                reservationId,
                status: 'ACTIVE'
            },
            data: {
                status: 'COMPLETED',
                completedAt: new Date()
            }
        });

        if (result.count === 0) {
            return {
                ok: false,
                error: 'No active reservations found with this ID'
            };
        }

        console.log(`Completed ${result.count} reservations for ${reservationId}`);
        return { ok: true };

    } catch (error) {
        console.error('Error completing stock reservation:', error);
        return {
            ok: false,
            error: 'Failed to complete reservation'
        };
    }
};

/**
 * Libera una reserva de stock (cuando se cancela o expira)
 */
export const releaseStockReservation = async (
    reservationId: string
): Promise<{ ok: boolean; error?: string }> => {
    try {
        const result = await prisma.stockReservation.updateMany({
            where: {
                reservationId,
                status: 'ACTIVE'
            },
            data: {
                status: 'RELEASED',
                releasedAt: new Date()
            }
        });

        if (result.count === 0) {
            return {
                ok: false,
                error: 'No active reservations found with this ID'
            };
        }

        console.log(`Released ${result.count} reservations for ${reservationId}`);
        return { ok: true };

    } catch (error) {
        console.error('Error releasing stock reservation:', error);
        return {
            ok: false,
            error: 'Failed to release reservation'
        };
    }
};

/**
 * Obtiene información de una reserva de stock
 */
export const getStockReservation = async (reservationId: string) => {
    try {
        const reservations = await prisma.stockReservation.findMany({
            where: { reservationId },
            include: {
                variant: {
                    include: {
                        product: {
                            select: {
                                title: true
                            }
                        }
                    }
                }
            }
        });

        return {
            ok: true,
            reservations
        };

    } catch (error) {
        console.error('Error getting stock reservation:', error);
        return {
            ok: false,
            error: 'Failed to get reservation'
        };
    }
};

/**
 * Limpia reservas expiradas automáticamente
 */
export const cleanExpiredReservations = async () => {
    try {
        const result = await prisma.stockReservation.updateMany({
            where: {
                status: 'ACTIVE',
                expiresAt: {
                    lt: new Date()
                }
            },
            data: {
                status: 'EXPIRED',
                releasedAt: new Date()
            }
        });

        console.log(`Cleaned ${result.count} expired reservations`);
        return {
            ok: true,
            cleanedCount: result.count
        };

    } catch (error) {
        console.error('Error cleaning expired reservations:', error);
        return {
            ok: false,
            error: 'Failed to clean expired reservations'
        };
    }
};

/**
 * Obtiene stock disponible considerando reservas activas
 */
export const getAvailableStock = async (variantId: string): Promise<number> => {
    try {
        const variant = await prisma.productVariant.findUnique({
            where: { id: variantId },
            select: { stock: true }
        });

        if (!variant) {
            return 0;
        }

        const activeReservations = await prisma.stockReservation.aggregate({
            where: {
                variantId,
                status: 'ACTIVE',
                expiresAt: {
                    gt: new Date()
                }
            },
            _sum: {
                quantity: true
            }
        });

        const reservedQuantity = activeReservations._sum.quantity || 0;
        return Math.max(0, variant.stock - reservedQuantity);

    } catch (error) {
        console.error('Error getting available stock:', error);
        return 0;
    }
};