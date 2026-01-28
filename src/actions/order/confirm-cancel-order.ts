'use server'

import {prisma} from "@/lib/prisma";
import { auth } from "@/auth.config";
import { revalidatePath } from "next/cache";

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
                    paymentStatus: 'paid',
                },
            });
            revalidatePath('/admin/orders')
            revalidatePath(`/admin/orders/${order.id}`)
            revalidatePath(`/orders`)
            return { ok: true, order };
        } else if (action === 'cancel') {
            // Cancelar: marcar como cancelado y devolver stock
            const order = await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'cancelled',
                },
            });
            // Devolver stock de los productos
            const items = await prisma.orderItem.findMany({ where: { orderId } });
            for (const item of items) {
                await prisma.productVariant.update({
                    where: { id: item.variantId },
                    data: { stock: { increment: item.quantity } },
                });
            }
            revalidatePath('/admin/orders')
            revalidatePath(`/admin/orders/${order.id}`)
            revalidatePath(`/orders`)
            return { ok: true, order };
        } else {
            return { ok: false, error: 'Acción no válida' };
        }
    } catch (error) {
        return { ok: false, error: 'Error al actualizar la orden' };
    }
}


