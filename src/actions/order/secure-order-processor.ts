'use server'

import prisma from "@/lib/prisma";
import { validateMercadoPagoPayment, validatePaymentIntegrity } from "../payments/validate-mercadopago-payment";

interface SecureOrderProcessResult {
    ok: boolean;
    message?: string;
    error?: string;
    orderId?: string;
    redirectTo?: string;
}

/**
 * Procesa una orden de forma segura validando el pago con Mercado Pago
 * y verificando la integridad de los datos
 */
export const processSecureOrder = async (
    paymentId: string,
    expectedOrderId?: string
): Promise<SecureOrderProcessResult> => {
    if (!paymentId) {
        return {
            ok: false,
            error: 'Payment ID is required'
        };
    }

    try {
        // 1. Validar el pago con Mercado Pago
        console.log('Validating payment with Mercado Pago:', paymentId);
        const paymentValidation = await validateMercadoPagoPayment(paymentId);

        if (!paymentValidation.ok) {
            console.error('Payment validation failed:', paymentValidation.error);
            return {
                ok: false,
                error: paymentValidation.error || 'Payment validation failed',
                message: paymentValidation.message
            };
        }

        const { orderId, paymentData } = paymentValidation;

        if (!orderId) {
            return {
                ok: false,
                error: 'No order ID found in payment validation'
            };
        }

        // 2. Si se proporciona expectedOrderId, verificar que coincida
        if (expectedOrderId && expectedOrderId !== orderId) {
            console.error('Order ID mismatch:', { expectedOrderId, orderId });
            return {
                ok: false,
                error: 'Order ID mismatch - possible security issue'
            };
        }

        // 3. Verificar el estado del pago y proceder según corresponda
        if (paymentData?.status === 'approved') {
            // El pago fue aprobado, verificar que la orden fue actualizada correctamente
            const updatedOrder = await prisma.order.findUnique({
                where: { id: orderId },
                select: {
                    id: true,
                    isPaid: true,
                    paymentStatus: true,
                    total: true,
                    user: {
                        select: {
                            email: true,
                            firstName: true
                        }
                    }
                }
            });

            if (!updatedOrder) {
                return {
                    ok: false,
                    error: 'Order not found after payment processing'
                };
            }

            if (!updatedOrder.isPaid) {
                return {
                    ok: false,
                    error: 'Order payment status was not updated correctly'
                };
            }

            console.log('Order processed successfully:', {
                orderId,
                isPaid: updatedOrder.isPaid,
                paymentStatus: updatedOrder.paymentStatus,
                total: updatedOrder.total
            });

            // TODO: Aquí podrías agregar lógica adicional como:
            // - Enviar email de confirmación
            // - Actualizar inventario
            // - Crear registro de auditoría
            // - Notificar a sistemas externos

            return {
                ok: true,
                message: 'Pago procesado y orden creada exitosamente',
                orderId,
                redirectTo: `/orders/${orderId}`
            };

        } else if (paymentData?.status === 'pending') {
            return {
                ok: true,
                message: 'Pago pendiente de aprobación',
                orderId,
                redirectTo: `/orders/payment-pending?order=${orderId}`
            };

        } else {
            // Pago rechazado, cancelado o estado desconocido
            return {
                ok: false,
                error: `Payment ${paymentData?.status || 'failed'}`,
                message: paymentValidation.message || 'El pago no pudo ser procesado',
                orderId
            };
        }

    } catch (error) {
        console.error('Error processing secure order:', error);
        return {
            ok: false,
            error: 'Internal error processing order'
        };
    }
};

/**
 * Valida la integridad de una orden antes de procesarla
 * Verifica stock, precios, descuentos, etc.
 */
export const validateOrderIntegrity = async (orderId: string): Promise<{
    ok: boolean;
    error?: string;
    details?: {
        hasStock: boolean;
        pricesValid: boolean;
        discountsValid: boolean;
        totalValid: boolean;
    };
}> => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                OrderItem: {
                    include: {
                        variant: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            return {
                ok: false,
                error: 'Order not found'
            };
        }

        const validationDetails = {
            hasStock: true,
            pricesValid: true,
            discountsValid: true,
            totalValid: true
        };

        let calculatedSubTotal = 0;

        // Validar cada item de la orden
        for (const item of order.OrderItem) {
            // 1. Verificar stock
            if (item.variant.stock < item.quantity) {
                validationDetails.hasStock = false;
                console.error('Insufficient stock:', {
                    variantId: item.variantId,
                    requested: item.quantity,
                    available: item.variant.stock
                });
            }

            // 2. Verificar que el precio del item coincida con el precio actual
            // Aplicar descuento si existe
            const discountAmount = item.variant.price * (item.variant.discountPercent / 100);
            const currentPrice = item.variant.price - discountAmount;
            
            if (Math.abs(item.price - currentPrice) > 0.01) { // Tolerancia de 1 centavo
                validationDetails.pricesValid = false;
                console.error('Price mismatch:', {
                    itemId: item.id,
                    storedPrice: item.price,
                    currentPrice,
                    originalPrice: item.variant.price,
                    discountPercent: item.variant.discountPercent
                });
            }

            // 3. Calcular subtotal
            const itemTotal = item.price * item.quantity;
            calculatedSubTotal += itemTotal;
        }

        // 4. Verificar que el subtotal calculado coincida
        if (Math.abs(order.subTotal - calculatedSubTotal) > 0.01) {
            validationDetails.totalValid = false;
            console.error('SubTotal mismatch:', {
                stored: order.subTotal,
                calculated: calculatedSubTotal
            });
        }

        // 5. Verificar total final (subtotal + tax - discounts)
        const expectedTotal = calculatedSubTotal + order.tax - order.discounts;
        if (Math.abs(order.total - expectedTotal) > 0.01) {
            validationDetails.totalValid = false;
            console.error('Total mismatch:', {
                stored: order.total,
                calculated: expectedTotal
            });
        }

        const allValid = Object.values(validationDetails).every(Boolean);

        return {
            ok: allValid,
            error: allValid ? undefined : 'Order validation failed',
            details: validationDetails
        };

    } catch (error) {
        console.error('Error validating order integrity:', error);
        return {
            ok: false,
            error: 'Internal error validating order'
        };
    }
};