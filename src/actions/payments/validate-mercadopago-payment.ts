'use server'

import prisma from "@/lib/prisma";
import { MercadoPagoConfig, Payment } from "mercadopago";

const mercadopago = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!
});

interface PaymentValidationResult {
    ok: boolean;
    message?: string;
    error?: string;
    orderId?: string;
    paymentData?: {
        status: string;
        amount: number;
        paymentId: string;
        dateApproved?: string;
        transactionId?: string;
    };
}

export const validateMercadoPagoPayment = async (paymentId: string): Promise<PaymentValidationResult> => {
    if (!paymentId) {
        return {
            ok: false,
            error: 'Payment ID is required'
        };
    }

    try {
        // 1. Obtener los datos del pago de Mercado Pago
        const paymentData = await new Payment(mercadopago).get({ id: paymentId });

        if (!paymentData) {
            return {
                ok: false,
                error: 'Payment not found in Mercado Pago'
            };
        }

        const { 
            status, 
            external_reference, 
            transaction_amount,
            date_approved,
            id: mpPaymentId 
        } = paymentData;

        // Verificar que tenemos los datos necesarios
        if (!transaction_amount) {
            return {
                ok: false,
                error: 'Payment amount not found'
            };
        }

        if (!status) {
            return {
                ok: false,
                error: 'Payment status not found'
            };
        }

        console.log('Mercado Pago payment data:', {
            status,
            external_reference,
            transaction_amount,
            date_approved,
            mpPaymentId
        });

        // 2. Verificar que tenemos un external_reference (sessionToken)
        if (!external_reference) {
            return {
                ok: false,
                error: 'No session reference found in payment'
            };
        }

        // 3. Buscar orden existente por transaction_id
        let order = await prisma.order.findFirst({
            where: { transactionId: mpPaymentId?.toString() || paymentId },
            include: {
                OrderItem: {
                    include: {
                        variant: true,
                        product: true
                    }
                },
                user: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        // Si no hay orden, buscar por sessionToken y crear la orden
        if (!order) {
            const { createOrderFromSession } = await import('../checkout/create-order-from-session');
            const result = await createOrderFromSession(external_reference, mpPaymentId?.toString() || paymentId);
            
            if (!result.ok || !result.orderId) {
                return {
                    ok: false,
                    error: result.error || 'No se pudo crear la orden desde la sesión'
                };
            }

            // Buscar la orden recién creada
            order = await prisma.order.findUnique({
                where: { id: result.orderId },
                include: {
                    OrderItem: {
                        include: {
                            variant: true,
                            product: true
                        }
                    },
                    user: {
                        select: {
                            email: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });

            if (!order) {
                return {
                    ok: false,
                    error: 'Error al recuperar la orden creada'
                };
            }
        }

        // 4. Verificar que la orden no haya sido pagada ya
        if (order.isPaid && order.paymentStatus === 'approved') {
            return {
                ok: true,  // ✅ Es un éxito, no un error
                message: 'Tu pago fue procesado exitosamente',
                orderId: order.id,
                paymentData: {
                    status: order.paymentStatus, // 'approved'
                    amount: parseFloat(transaction_amount.toFixed(2)),
                    paymentId: mpPaymentId?.toString() || paymentId,
                    dateApproved: date_approved || order.paidAt?.toISOString(),
                    transactionId: order.transactionId || mpPaymentId?.toString() || paymentId
                }
            };
        }

        // 5. Verificar que el monto del pago coincida con el total de la orden
        const expectedAmount = parseFloat(order.total.toFixed(2));
        const receivedAmount = parseFloat(transaction_amount.toFixed(2));

        if (expectedAmount !== receivedAmount) {
            console.error('Amount mismatch:', { expectedAmount, receivedAmount });
            return {
                ok: false,
                error: `Amount mismatch. Expected: ${expectedAmount}, Received: ${receivedAmount}`
            };
        }

        // 6. Verificar que no existe ya una transacción con este ID de Mercado Pago
        if (mpPaymentId) {
            const existingTransaction = await prisma.order.findFirst({
                where: { 
                    transactionId: mpPaymentId.toString(),
                    isPaid: true 
                }
            });

            if (existingTransaction) {
                return {
                    ok: false,
                    error: 'Payment already processed',
                    message: 'Este pago ya fue procesado anteriormente'
                };
            }
        }

        // 7. Procesar según el estado del pago
        const result: PaymentValidationResult = {
            ok: false,
            orderId: order.id,
            paymentData: {
                status: status || 'unknown',
                amount: receivedAmount,
                paymentId: mpPaymentId?.toString() || paymentId,
                dateApproved: date_approved || undefined,
                transactionId: mpPaymentId?.toString() || paymentId
            }
        };

        switch (status) {
            case 'approved':
                // Actualizar la orden como pagada
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        isPaid: true,
                        paymentStatus: 'approved',
                        paidAt: new Date(date_approved || Date.now()),
                        transactionId: mpPaymentId?.toString() || paymentId
                    }
                });

                result.ok = true;
                result.message = 'Pago aprobado y orden actualizada correctamente';
                break;

            case 'pending':
                // Actualizar la orden como pendiente
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: 'pending',
                        transactionId: mpPaymentId?.toString() || paymentId
                    }
                });

                result.ok = true;
                result.message = 'Pago pendiente de aprobación';
                break;

            case 'rejected':
            case 'cancelled':
                // Actualizar el estado pero no marcar como pagada
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: status,
                        transactionId: mpPaymentId?.toString() || paymentId
                    }
                });

                result.ok = false;
                result.message = status === 'rejected' 
                    ? 'El pago fue rechazado' 
                    : 'El pago fue cancelado';
                break;

            default:
                // Estado desconocido
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: status,
                        transactionId: mpPaymentId?.toString() || paymentId
                    }
                });

                result.ok = false;
                result.message = `Pago en estado desconocido: ${status}`;
                break;
        }

        console.log('Payment validation result:', result);
        return result;

    } catch (error) {
        console.error('Error validating Mercado Pago payment:', error);
        return {
            ok: false,
            error: 'Error interno al validar el pago'
        };
    }
};

/**
 * Función auxiliar para validar múltiples aspectos del pago
 * antes de procesar la orden
 */
export const validatePaymentIntegrity = async (orderId: string, paymentAmount: number): Promise<boolean> => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { 
                total: true, 
                isPaid: true,
                paymentStatus: true 
            }
        });

        if (!order) {
            console.error('Order not found for validation:', orderId);
            return false;
        }

        if (order.isPaid) {
            console.error('Order already paid:', orderId);
            return false;
        }

        const expectedAmount = parseFloat(order.total.toFixed(2));
        const receivedAmount = parseFloat(paymentAmount.toFixed(2));

        if (expectedAmount !== receivedAmount) {
            console.error('Amount validation failed:', {
                orderId,
                expectedAmount,
                receivedAmount
            });
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error validating payment integrity:', error);
        return false;
    }
};