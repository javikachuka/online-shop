'use server'

import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export const cancelCheckoutSession = async (sessionToken: string) => {
    if (!sessionToken) {
        return {
            ok: false,
            error: 'Sesión de checkout inválida'
        };
    }

    const session = await auth();
    if (!session?.user?.id) {
        return {
            ok: false,
            error: 'Usuario no autenticado'
        };
    }

    try {
        const orderSession = await prisma.orderSession.findFirst({
            where: {
                sessionToken,
                userId: session.user.id
            }
        });

        if (!orderSession) {
            return {
                ok: true,
                message: 'No había una reserva activa para liberar'
            };
        }

        if (orderSession.isProcessed) {
            return {
                ok: true,
                message: 'La sesión ya fue procesada previamente'
            };
        }

        const releasedAt = new Date();

        const result = await prisma.$transaction(async (tx) => {
            const releasedReservations = await tx.stockReservation.updateMany({
                where: {
                    orderKey: sessionToken,
                    status: 'ACTIVE'
                },
                data: {
                    status: 'RELEASED',
                    releasedAt
                }
            });

            await tx.orderSession.update({
                where: { id: orderSession.id },
                data: {
                    expiresAt: releasedAt,
                    updatedAt: releasedAt
                }
            });

            return releasedReservations.count;
        });

        return {
            ok: true,
            releasedCount: result,
            message: 'Reserva liberada correctamente'
        };
    } catch (error) {
        console.error('❌ Error cancelando OrderSession:', error);
        return {
            ok: false,
            error: 'No se pudo liberar la reserva activa'
        };
    }
};
