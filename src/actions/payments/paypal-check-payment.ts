'use server'

import { PayPalOrderStatusResponse } from "@/interfaces";
import prisma from "@/lib/prisma";
import { stat } from "fs";
import { revalidatePath } from "next/cache";

export const paypalCheckPayment = async (transactionId: string) => {

    if (!transactionId) {
        return {
            ok: false,
            error: 'Transaction ID is required'
        };
    }

    try {
        const authToken = await getPayPalBearerToken();
        if (!authToken) {
            return {
                ok: false,
                error: authToken.error || 'Failed to get PayPal bearer token'
            };
        }
        console.log('PayPal Bearer Token:', authToken);

        const paymentStatus = await verifyPayPalPayment(transactionId, authToken);
        if (!paymentStatus) {
            return {
                ok: false,
                error: 'Failed to verify PayPal payment'
            };
        }
        console.log('PayPal Payment Status:', paymentStatus);

        const {status, purchase_units} = paymentStatus;

        if (status !== 'COMPLETED') {
            return {
                ok: false,
                error: `Payment status is not completed: ${status}`
            };
        }
        if (!purchase_units || purchase_units.length === 0) {
            return {
                ok: false,
                error: 'No purchase units found in payment status'
            };
        }

        const {invoice_id: orderId} = purchase_units[0];
        if (!orderId) {
            return {
                ok: false,
                error: 'Invoice ID not found in purchase units'
            };
        }

        try {

            await prisma.order.update({
                where: {
                    id: orderId
                },
                data: {
                    isPaid: true,
                    paidAt: new Date()
                }
            })

            revalidatePath(`/orders/${orderId}`);

            return {
                ok: true,
                message: 'El pago se ha realizado con exito',
                orderId
            };
            
        } catch (error) {
            return {
                ok: false,
                message: 'El pago no pudo realizarse con exito'
            }
        }

        console.log(status);
        console.log(purchase_units);
        

        
    } catch (error) {
        console.error('Error checking PayPal payment:', error);
        return {
            ok: false,
            error: 'Failed to check PayPal payment'
        };
    }
}

const getPayPalBearerToken = async () => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    const auth = Buffer.from(`${clientId}:${secret}`, 'utf-8').toString('base64');
    const apiUrl = process.env.PAYPAL_API_URL || '';


    if (!clientId || !secret) {
        throw new Error('PayPal client ID and secret must be set in environment variables');
    }

    try {
        const response = await fetch(apiUrl+'/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            cache: 'no-store',
            body: new URLSearchParams({ 'grant_type': 'client_credentials' })
        }).then(res => res.json());
        
        if (!response.access_token) {
            throw new Error('Failed to retrieve access token from PayPal');
        }
        return response.access_token;
        
    } catch (error) {
        console.error('Error getting PayPal bearer token:', error);
        return {
            ok: false,
            error: 'Failed to get PayPal bearer token'
        };
        
    }

}

const verifyPayPalPayment = async (transactionId: string, authToken: string): Promise<PayPalOrderStatusResponse|null> => {
    const verifyUrl = `${process.env.PAYPAL_API_URL}/v2/checkout/orders/${transactionId}`;

    try {
        const response = await fetch(verifyUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`PayPal verification failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('PayPal Verification Data:', data);
        
        return data;
        
    } catch (error) {
        console.error('Error verifying PayPal payment:', error);
        return null
    }
}