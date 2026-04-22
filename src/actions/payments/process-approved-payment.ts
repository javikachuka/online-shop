'use server'

import { validateMercadoPagoPayment } from './validate-mercadopago-payment';
import { prisma } from '@/lib/prisma';
import { sendOrderPaymentConfirmationEmail } from '@/lib/order-email';

interface ProcessApprovedPaymentResult {
    ok: boolean;
    error?: string;
    orderId?: string;
    status?: string;
    message?: string;
    clearCart?: boolean; // 🧹 Señal para limpiar carrito
}

/**
 * Procesa un pago aprobado en el contexto del nuevo flujo híbrido:
 * - Busca órdenes existentes con pending_payment
 * - Las actualiza a 'paid' si el pago fue aprobado
 * - Maneja el descuento de stock definitivo
 * - Es idempotente (no procesa la misma orden dos veces)
 */
export const processApprovedPayment = async (paymentId: string): Promise<ProcessApprovedPaymentResult> => {
    try {
        console.log(`🔍 Procesando payment_id: ${paymentId} con flujo híbrido`);
        
        // 1. VALIDAR DIRECTAMENTE CON MERCADO PAGO
        const mpValidation = await validateMercadoPagoPayment(paymentId);
        
        if (!mpValidation.ok) {
            console.error('❌ Error validando con MP:', mpValidation.error);
            return {
                ok: false,
                error: mpValidation.error || 'Error al validar con Mercado Pago'
            };
        }

        const { paymentData, orderId } = mpValidation;
        
        if (!paymentData || !orderId) {
            return {
                ok: false,
                error: 'Datos de pago incompletos'
            };
        }

        console.log(`✅ Payment status from MP: ${paymentData.status}`);

        // 2. VERIFICAR SI YA EXISTE UNA ORDEN CON ESTE PAYMENT_ID EN TRANSACTION_ID
        const existingOrderByTransaction = await prisma.order.findFirst({
            where: {
                transactionId: paymentId
            }
        });

        if (existingOrderByTransaction && existingOrderByTransaction.paymentStatus === 'approved') {
            console.log('✅ Orden ya procesada como pagada por transaction_id');
            return {
                ok: true,
                orderId: existingOrderByTransaction.id,
                status: 'already_processed',
                message: 'Tu pago ya fue confirmado y tu pedido está listo para ser consultado.',
                clearCart: true // 🧹 Señal para limpiar carrito
            };
        }

        // 3. PROCESAR SEGÚN ESTADO DE MP
        switch (paymentData.status) {
            case 'approved': {
                const result = await handleApprovedPayment(orderId, paymentId, paymentData);

                if (result.ok && result.status === 'approved' && result.orderId) {
                    const emailResult = await sendOrderPaymentConfirmationEmail(result.orderId);
                    if (!emailResult.ok) {
                        console.error(`⚠️ No se pudo enviar el email de confirmación para la orden ${result.orderId}: ${emailResult.message}`);
                    }
                }

                return result;
            }
                
            case 'pending':
            case 'in_process':
                return {
                    ok: true,
                    orderId,
                    status: 'pending',
                    message: 'Pago pendiente de aprobación'
                };
                
            case 'rejected':
            case 'cancelled':
                return await handleRejectedPayment(orderId, paymentId, paymentData.status, paymentData);
                
            default:
                console.warn(`⚠️ Estado de pago no reconocido: ${paymentData.status}`);
                return {
                    ok: false,
                    error: `Estado de pago no válido: ${paymentData.status}`
                };
        }

    } catch (error: any) {
        console.error('❌ Error procesando pago aprobado:', error);
        return {
            ok: false,
            error: error.message || 'Error interno al procesar el pago'
        };
    }
};

/**
 * Maneja un pago aprobado:
 * - Actualiza orden a 'paid' con stock definitivo
 * - Libera reservas temporales
 * - Maneja el flujo completo de forma transaccional
 */
async function handleApprovedPayment(
    orderId: string, 
    paymentId: string, 
    paymentData: any
): Promise<ProcessApprovedPaymentResult> {
    try {
        console.log(`💰 Procesando pago aprobado para orden: ${orderId}`);
        
        // Usar transacción para garantizar consistencia
        const result = await prisma.$transaction(async (tx) => {
            // Obtener la orden actual
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: {
                    OrderItem: true
                }
            });

            if (!order) {
                throw new Error(`Orden ${orderId} no encontrada`);
            }

            // Verificar si ya está pagada para evitar doble procesamiento
            if (order.paymentStatus === 'approved' && order.isPaid) {
                return {
                    ok: true,
                    orderId: order.id,
                    status: 'already_processed',
                    message: 'Orden ya procesada como pagada',
                    clearCart: true // 🧹 Señal para limpiar carrito
                };
            }

            // Actualizar orden a pagada
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    orderStatus: 'paid',
                    paymentStatus: 'approved',
                    isPaid: true,
                    paidAt: new Date(paymentData.dateApproved || Date.now()),
                    transactionId: paymentId
                }
            });

            // Descontar stock definitivamente (las reservas ya están activas)
            const stockUpdates = order.OrderItem.map(item =>
                tx.productVariant.update({
                    where: { id: item.variantId },
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                })
            );

            await Promise.all(stockUpdates);

            const reservationKeys = [orderId];
            if (paymentData?.externalReference && paymentData.externalReference !== orderId) {
                reservationKeys.push(paymentData.externalReference);
            }

            // Completar reservas temporales
            await tx.stockReservation.updateMany({
                where: {
                    orderKey: { in: reservationKeys },
                    status: 'ACTIVE'
                },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            });

            console.log(`✅ Orden ${orderId} procesada como pagada exitosamente`);
            
            // TODO: Aquí podrías limpiar el carrito del store si tienes uno server-side
            // O enviar una señal al cliente para que lo limpie
            
            return {
                ok: true,
                orderId: updatedOrder.id,
                status: 'approved',
                message: 'Pago procesado exitosamente',
                clearCart: true // 🧹 Señal para limpiar carrito
            };
        });

        return result;

    } catch (error: any) {
        console.error('❌ Error procesando pago aprobado:', error);
        return {
            ok: false,
            error: error.message || 'Error al procesar pago aprobado'
        };
    }
}

/**
 * Maneja un pago rechazado o cancelado:
 * - Actualiza estado de la orden
 * - Libera reservas de stock
 * - No procesa el pago
 */
async function handleRejectedPayment(
    orderId: string, 
    paymentId: string, 
    status: string,
    paymentData?: any
): Promise<ProcessApprovedPaymentResult> {
    try {
        console.log(`❌ Procesando pago rechazado/cancelado para orden: ${orderId}`);
        
        await prisma.$transaction(async (tx) => {
            // Actualizar estado de la orden
            await tx.order.update({
                where: { id: orderId },
                data: {
                    orderStatus: 'cancelled',
                    paymentStatus: status,
                    transactionId: paymentId
                    // No actualizar isPaid ni paidAt
                }
            });

            const reservationKeys = [orderId];
            if (paymentData?.externalReference && paymentData.externalReference !== orderId) {
                reservationKeys.push(paymentData.externalReference);
            }

            // Liberar reservas de stock (pago no exitoso)
            await tx.stockReservation.updateMany({
                where: {
                    orderKey: { in: reservationKeys },
                    status: 'ACTIVE'
                },
                data: {
                    status: 'CANCELLED',
                    releasedAt: new Date()
                }
            });
        });

        const message = status === 'rejected' ? 'El pago fue rechazado' : 'El pago fue cancelado';
        console.log(`📋 Orden ${orderId}: ${message}`);
        
        return {
            ok: false,
            orderId,
            status,
            message
        };

    } catch (error: any) {
        console.error('❌ Error procesando pago rechazado:', error);
        return {
            ok: false,
            error: error.message || 'Error al procesar pago rechazado'
        };
    }
}