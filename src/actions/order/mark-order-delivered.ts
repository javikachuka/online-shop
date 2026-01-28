'use server'

import {prisma} from "@/lib/prisma";
import { auth } from "@/auth.config";
import { revalidatePath } from "next/cache";

export async function markOrderAsDelivered(orderId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    const role = session?.user?.role;
    
    if (!userId || role !== 'admin') {
        return { ok: false, error: 'No autorizado' };
    }

    try {
        // Verificar que la orden existe y está en estado 'paid'
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
            select: { 
                id: true, 
                isPaid: true, 
                orderStatus: true,
                paymentStatus: true 
            }
        });

        if (!existingOrder) {
            return { ok: false, error: 'Orden no encontrada' };
        }

        // Verificar que la orden esté pagada
        if (!existingOrder.isPaid || existingOrder.paymentStatus !== 'paid') {
            return { ok: false, error: 'Solo se pueden marcar como entregadas las órdenes que están pagadas' };
        }

        // Verificar que no esté ya entregada
        if (existingOrder.orderStatus === 'delivered') {
            return { ok: false, error: 'Esta orden ya fue marcada como entregada' };
        }

        // Marcar como entregada
        const order = await prisma.order.update({
            where: { id: orderId },
            data: {
                orderStatus: 'delivered',
                delivered: new Date(),
            },
        });

        console.log(`✅ Order ${orderId} marked as delivered by admin ${userId}`);

        // TODO: Opcional - Enviar email de confirmación de entrega
        // try {
        //     await sendOrderDeliveredEmail(orderId);
        // } catch (emailError) {
        //     console.error('Failed to send delivery confirmation email:', emailError);
        //     // No fallar la operación si el email falla
        // }

        // Revalidar las páginas que muestran esta información
        revalidatePath('/admin/orders');
        revalidatePath(`/admin/orders/${orderId}`);
        revalidatePath('/orders');

        return { ok: true, order };

    } catch (error) {
        console.error('Error marking order as delivered:', error);
        return { ok: false, error: 'Error interno del servidor' };
    }
}