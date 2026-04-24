'use server'

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";
import { revalidatePath } from "next/cache";
import { sendOrderPaymentConfirmationEmail } from "@/lib/order-email";

export async function confirmOrCancelOrder(orderId: string, action: 'confirm' | 'cancel') {
    const session = await auth();
    const userId = session?.user?.id;
    const role = session?.user?.role;
    if (!userId || role !== 'admin') {
        return { ok: false, error: 'No autorizado' };
    }
    try {
        if (action === 'confirm') {
            // Confirmar: marcar como pagado y poner fecha de pago
            const order = await prisma.order.update({
                where: { id: orderId },
                data: {
                    isPaid: true,
                    paidAt: new Date(),
                    orderStatus: 'paid',
                    paymentStatus: 'approved',
                },
            });

            const emailResult = await sendOrderPaymentConfirmationEmail(order.id);
            if (!emailResult.ok) {
                console.error(`⚠️ No se pudo enviar el email de pago confirmado para la orden ${order.id}: ${emailResult.message}`);
            }

            revalidatePath('/admin/orders')
            revalidatePath(`/admin/orders/${order.id}`)
            revalidatePath(`/orders`)
            revalidatePath(`/orders/${order.id}`)
            return { ok: true, order };
        } else if (action === 'cancel') {
            // Cancelar: marcar como cancelado, liberar reservas y devolver stock dentro de transacción
            const result = await prisma.$transaction(async (tx) => {
                // 1. Obtener orden e items antes de actualizar
                const order = await tx.order.findUnique({
                    where: { id: orderId },
                    include: { OrderItem: true }
                });

                if (!order) {
                    throw new Error('Orden no encontrada');
                }

                // 2. Liberar StockReservations asociadas a esta orden de forma precisa
                if (order.checkoutSessionToken) {
                    // Orden creada desde MP: liberar SOLO las reservas de esa sesión específica
                    await tx.stockReservation.updateMany({
                        where: {
                            orderKey: order.checkoutSessionToken,
                            status: 'ACTIVE',
                        },
                        data: {
                            status: 'RELEASED',
                            releasedAt: new Date()
                        }
                    });
                }
                // Orden por transferencia: no hay StockReservation, no se hace nada aquí

                // 3. Incrementar stock de los productos
                for (const item of order.OrderItem) {
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: { stock: { increment: item.quantity } }
                    });
                }

                // 4. Marcar la orden como cancelada
                const cancelledOrder = await tx.order.update({
                    where: { id: orderId },
                    data: {
                        orderStatus: 'cancelled',
                        paymentStatus: 'cancelled',
                        updatedAt: new Date()
                    }
                });

                return cancelledOrder;
            });

            revalidatePath('/admin/orders')
            revalidatePath(`/admin/orders/${orderId}`)
            revalidatePath(`/orders`)
            return { ok: true, order: result };
        } else {
            return { ok: false, error: 'Acción no válida' };
        }
    } catch (error) {
        console.error('❌ Error en confirmOrCancelOrder:', error);
        return { ok: false, error: 'Error al actualizar la orden' };
    }
}


