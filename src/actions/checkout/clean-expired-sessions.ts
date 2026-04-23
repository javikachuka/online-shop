import { prisma } from '@/lib/prisma';

/**
 * Limpia OrderSessions expiradas y libera sus reservas de stock
 * Esta función debería ejecutarse periódicamente (ej: cada 5 minutos via cron)
 */
export const cleanExpiredOrderSessions = async () => {
    try {
        console.log('🧹 Iniciando limpieza de OrderSessions expiradas...');

        const result = await prisma.$transaction(async (tx) => {
            // 1. Buscar OrderSessions expiradas no procesadas
            const expiredSessions = await tx.orderSession.findMany({
                where: {
                    expiresAt: { lt: new Date() },
                    isProcessed: false
                },
                select: {
                    id: true,
                    sessionToken: true,
                    userId: true,
                    total: true
                }
            });

            if (expiredSessions.length === 0) {
                console.log('✅ No hay OrderSessions expiradas para limpiar');
                return { cleaned: 0, stockReleased: 0 };
            }

            console.log(`🗑️  Encontradas ${expiredSessions.length} sesiones expiradas`);

            // 2. Liberar reservas de stock asociadas
            let stockReleasedCount = 0;
            for (const session of expiredSessions) {
                const stockReservations = await tx.stockReservation.updateMany({
                    where: {
                        orderKey: session.sessionToken,
                        status: 'ACTIVE'
                    },
                    data: {
                        status: 'EXPIRED',
                        releasedAt: new Date()
                    }
                });
                
                stockReleasedCount += stockReservations.count;
                console.log(`📦 Liberadas ${stockReservations.count} reservas para sesión ${session.sessionToken}`);
            }

            // 3. Marcar las OrderSessions como expiradas (no las eliminamos para auditoria)
            await tx.orderSession.updateMany({
                where: {
                    id: { in: expiredSessions.map(s => s.id) }
                },
                data: {
                    // Podrías agregar un campo 'status' si quieres
                    updatedAt: new Date()
                }
            });

            // 4. Opcional: Eliminar OrderSessions muy antiguas (ej: más de 7 días)
            const veryOldDate = new Date();
            veryOldDate.setDate(veryOldDate.getDate() - 7);
            
            const deletedOldSessions = await tx.orderSession.deleteMany({
                where: {
                    expiresAt: { lt: veryOldDate },
                    isProcessed: false
                }
            });

            console.log(`🗑️  Eliminadas ${deletedOldSessions.count} sesiones muy antiguas`);

            return {
                cleaned: expiredSessions.length,
                stockReleased: stockReleasedCount,
                deleted: deletedOldSessions.count
            };
        });

        console.log(`✅ Limpieza completada:`, result);
        return result;

    } catch (error) {
        console.error('❌ Error en limpieza de OrderSessions:', error);
        throw error;
    }
};

/**
 * Obtiene estadísticas de OrderSessions para monitoreo
 */
export const getOrderSessionStats = async () => {
    try {
        const now = new Date();
        
        const stats = await prisma.orderSession.aggregate({
            _count: {
                id: true
            },
            where: {
                isProcessed: false
            }
        });

        const expiredCount = await prisma.orderSession.count({
            where: {
                expiresAt: { lt: now },
                isProcessed: false
            }
        });

        const activeCount = await prisma.orderSession.count({
            where: {
                expiresAt: { gte: now },
                isProcessed: false
            }
        });

        const processedCount = await prisma.orderSession.count({
            where: {
                isProcessed: true
            }
        });

        return {
            total: stats._count.id,
            active: activeCount,
            expired: expiredCount,
            processed: processedCount
        };

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        throw error;
    }
};