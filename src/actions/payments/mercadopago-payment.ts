'use server'

import {prisma} from "@/lib/prisma";
import {MercadoPagoConfig, Preference, Payment} from "mercadopago"
import { revalidatePath } from "next/cache";

const mercadopago = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!
});

export const createMercadoPagoPreference = async (orderId: string, amount: number, description: string) => {
    if (!orderId || !amount || !description) {
        return {
            ok: false,
            error: 'Order ID, amount, and description are required'
        };
    }

    try {

        // Limita la longitud del título a 256 caracteres
        const safeTitle = description.substring(0, 256);

        console.log(safeTitle);

        // URL base por defecto si no está definida
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        
        // Create a payment preference
        const preference = {
            items: [
                {
                    title: safeTitle,
                    unit_price: amount,
                    quantity: 1,
                    id: orderId
                }
            ],
            external_reference: orderId,
            back_urls: {
                success: `${baseUrl}/orders/payment-success`,
                failure: `${baseUrl}/checkout?error=payment_failed`,
                pending: `${baseUrl}/orders/payment-pending`
            },
            auto_return: "approved",
            // notification_url: `${baseUrl}/api/mercadopago-webhook`
        };

        console.log('Preference back_urls:', preference.back_urls);

        const response = await new Preference(mercadopago).create({
            body: preference
        });

        if(!response || !response.init_point) {
            return {
                ok: false,
                error: 'Failed to create Mercado Pago payment preference'
            };
        }
        
        return {
            ok: true,
            redirectTo: response.init_point,
            message: 'Mercado Pago payment created successfully'
        };
    } catch (error) {
        console.error('Error creating Mercado Pago payment:', error);
        return {
            ok: false,
            error: 'Failed to create Mercado Pago payment'
        };
    }
}

export const validateMercadoPagoPayment = async (mpId: string) => {
    try {
        const payment = await new Payment(mercadopago).get({ id: mpId });

        // Puedes extraer más datos si lo necesitas
        const { status, external_reference } = payment;
        console.log(status);

        console.log({external_reference});
        
        
        
        // Aquí deberías buscar la orden en tu base de datos usando el order.id o un campo relacionado
        // Ejemplo: const dbOrder = await prisma.order.findUnique({ where: { id: order.id } });

        if (status === "approved") {
            // Actualiza la orden como pagada
            await prisma.order.update({ where: { id: external_reference }, data: { isPaid: true, paymentStatus: 'approved' } });
            revalidatePath(`/orders/${external_reference}`);
            
            return { ok: true, message: "Pago aprobado y orden actualizada" };
        }

        if (status === "pending") {
            // Puedes actualizar la orden como pendiente
            await prisma.order.update({ where: { id: external_reference }, data: { paymentStatus: 'pending' } });
            revalidatePath(`/orders/${external_reference}`);
            return { ok: true, message: "Pago pendiente, orden actualizada" };
        }

        // Otros estados posibles: rejected, cancelled, etc.
        await prisma.order.update({ where: { id: external_reference }, data: { paymentStatus: status } });
        return { ok: false, message: `Pago con estado: ${status}` };

    } catch (error) {
        console.error('Error validando pago de Mercado Pago:', error);
        return { ok: false, error: 'Error validando pago de Mercado Pago' };
    }
};