'use server'

import {prisma} from "@/lib/prisma";


export const setOrderTransactionId = async (orderId: string, transactionId: string) => {
    if (!orderId || !transactionId) {
        return {
            ok: false,
            error: 'Order ID and Transaction ID are required'
        };
    }

    try {
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { transactionId }
        });

        return {
            ok: true,
            order: updatedOrder
        };
    } catch (error) {
        console.error('Error updating order transaction ID:', error);
        return {
            ok: false,
            error: 'Failed to update order transaction ID'
        };
    }
}