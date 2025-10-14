'use server'

import prisma from "@/lib/prisma";

interface ExpirationResult {
    ok: boolean;
    expiredOrdersCount: number;
    releasedStockItems: number;
    errors?: string[];
}

/**
 * Proceso programado para expirar órdenes vencidas
 * Debe ejecutarse cada 5 minutos aproximadamente
 */
export const expireOldOrders = async (): Promise<ExpirationResult> => {
    console.log('🕐 Iniciando proceso de expiración de órdenes...');
    
    const now = new Date();
    const errors: string[] = [];
    let expiredOrdersCount = 0;
    let releasedStockItems = 0;

    try {
        // Buscar órdenes que deben expirar
        const ordersToExpire = await prisma.order.findMany({
            where: {
                orderStatus: 'pending_payment',
                reservationExpiresAt: {
                    lt: now // Menor que NOW = ya expiró
                }
            },
            include: {
                OrderItem: {
                    include: {
                        variant: {
                            select: {
                                id: true,
                                sku: true,
                                product: {
                                    select: {
                                        title: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (ordersToExpire.length === 0) {
            console.log('✨ No hay órdenes para expirar');
            return {
                ok: true,
                expiredOrdersCount: 0,
                releasedStockItems: 0
            };
        }

        console.log(`📋 Encontradas ${ordersToExpire.length} órdenes para expirar`);

        // Procesar cada orden individualmente para evitar fallos en lote
        for (const order of ordersToExpire) {
            try {
                await expireOrder(order);
                expiredOrdersCount++;
                releasedStockItems += order.OrderItem.length;
                
                console.log(`✅ Orden expirada: ${order.id}`);
                
            } catch (orderError: any) {
                console.error(`❌ Error expirando orden ${order.id}:`, orderError);
                errors.push(`Order ${order.id}: ${orderError.message}`);
            }
        }

        console.log(`🎯 Proceso completado: ${expiredOrdersCount} órdenes expiradas, ${releasedStockItems} items de stock liberados`);

        return {
            ok: true,
            expiredOrdersCount,
            releasedStockItems,
            errors: errors.length > 0 ? errors : undefined
        };

    } catch (error: any) {
        console.error('❌ Error general en proceso de expiración:', error);
        return {
            ok: false,
            expiredOrdersCount,
            releasedStockItems,
            errors: [error.message]
        };
    }
};

/**
 * Expira una orden específica y libera su stock
 */
async function expireOrder(order: any) {
    return await prisma.$transaction(async (tx) => {
        
        // 1. Actualizar estado de la orden a expired
        await tx.order.update({
            where: { id: order.id },
            data: {
                orderStatus: 'expired',
                updatedAt: new Date()
            }
        });

        // 2. Liberar reservas de stock asociadas
        const stockReservationId = `order-${order.id}`;
        
        const reservationUpdate = await tx.stockReservation.updateMany({
            where: {
                reservationId: stockReservationId,
                status: 'ACTIVE'
            },
            data: {
                status: 'EXPIRED',
                releasedAt: new Date()
            }
        });

        console.log(`🔓 Liberadas ${reservationUpdate.count} reservas de stock para orden ${order.id}`);

        // 3. Log detallado de los productos liberados
        for (const item of order.OrderItem) {
            console.log(`📦 Stock liberado: ${item.variant.product.title} (${item.variant.sku}) x${item.quantity}`);
        }
    });
}

/**
 * Función de utilidad para limpiar reservas huérfanas
 * (reservas que no están asociadas a ninguna orden)
 */
export const cleanOrphanedReservations = async () => {
    console.log('🧹 Limpiando reservas huérfanas...');
    
    try {
        const now = new Date();
        
        // Limpiar reservas expiradas que no tienen orden asociada
        const cleanupResult = await prisma.stockReservation.updateMany({
            where: {
                status: 'ACTIVE',
                expiresAt: { lt: now },
                orderKey: null // Sin orden asociada
            },
            data: {
                status: 'EXPIRED',
                releasedAt: now
            }
        });

        console.log(`🧹 Limpiadas ${cleanupResult.count} reservas huérfanas`);
        return cleanupResult.count;

    } catch (error: any) {
        console.error('❌ Error limpiando reservas huérfanas:', error);
        throw error;
    }
};

/**
 * Función para obtener estadísticas del sistema de órdenes
 */
export const getOrderExpirationStats = async () => {
    try {
        const stats = await prisma.order.groupBy({
            by: ['orderStatus'],
            _count: {
                orderStatus: true
            }
        });

        const reservationStats = await prisma.stockReservation.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });

        // Órdenes próximas a expirar (próximos 5 minutos)
        const soonToExpire = await prisma.order.count({
            where: {
                orderStatus: 'pending_payment',
                reservationExpiresAt: {
                    gt: new Date(),
                    lt: new Date(Date.now() + 5 * 60 * 1000) // Próximos 5 minutos
                }
            }
        });

        return {
            ok: true,
            orderStats: stats.reduce((acc, stat) => {
                acc[stat.orderStatus] = stat._count.orderStatus;
                return acc;
            }, {} as Record<string, number>),
            reservationStats: reservationStats.reduce((acc, stat) => {
                acc[stat.status] = stat._count.status;
                return acc;
            }, {} as Record<string, number>),
            soonToExpire
        };

    } catch (error: any) {
        console.error('❌ Error obteniendo estadísticas:', error);
        return {
            ok: false,
            error: error.message
        };
    }
};

/**
 * Función para forzar la expiración de una orden específica
 * (útil para testing o casos especiales)
 */
export const forceExpireOrder = async (orderId: string) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                OrderItem: {
                    include: {
                        variant: {
                            select: {
                                sku: true,
                                product: {
                                    select: {
                                        title: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            throw new Error('Orden no encontrada');
        }

        if (order.orderStatus !== 'pending_payment') {
            throw new Error(`Orden está en estado ${order.orderStatus}, no se puede expirar`);
        }

        await expireOrder(order);
        
        return {
            ok: true,
            message: `Orden ${orderId} expirada manualmente`,
            releasedItems: order.OrderItem.length
        };

    } catch (error: any) {
        console.error(`❌ Error forzando expiración de orden ${orderId}:`, error);
        return {
            ok: false,
            error: error.message
        };
    }
};