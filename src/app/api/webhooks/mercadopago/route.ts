import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const mercadopago = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!
});

/**
 * Webhook idempotente de MercadoPago
 * Procesa notificaciones de pago y actualiza estados de orden
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        console.log('🔔 Webhook MP recibido:', JSON.stringify(body, null, 2));

        // Verificar que sea una notificación de pago
        if (body.type !== 'payment') {
            console.log('ℹ️  Notificación no es de pago, ignorando');
            return NextResponse.json({ status: 'ignored' });
        }

        const paymentId = body.data?.id;
        if (!paymentId) {
            console.error('❌ Payment ID no encontrado en webhook');
            return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
        }

        // Procesar el pago de forma idempotente
        const result = await processPaymentWebhook(paymentId);
        
        return NextResponse.json(result);

    } catch (error) {
        console.error('❌ Error procesando webhook MP:', error);
        return NextResponse.json(
            { error: 'Internal server error' }, 
            { status: 500 }
        );
    }
}

/**
 * Procesa un pago de forma idempotente - FLUJO HÍBRIDO
 * Verifica si el frontend ya procesó el pago antes de procesar
 */
async function processPaymentWebhook(paymentId: string) {
    console.log('🔍 Procesando pago webhook (flujo híbrido):', paymentId);

    try {
        // 1. VERIFICAR SI YA FUE PROCESADO POR FRONTEND O WEBHOOK PREVIO (idempotencia)
        const existingOrderByTransaction = await prisma.order.findFirst({
            where: { 
                transactionId: paymentId,
                paymentStatus: 'approved',
                isPaid: true
            }
        });

        if (existingOrderByTransaction) {
            console.log('✅ Pago ya procesado por frontend/webhook anterior:', paymentId);
            return { 
                status: 'already_processed_by_frontend', 
                orderId: existingOrderByTransaction.id,
                orderStatus: existingOrderByTransaction.orderStatus
            };
        }

        // 2. Obtener información del pago desde MercadoPago
        const payment = await new Payment(mercadopago).get({ id: paymentId });
        
        if (!payment) {
            throw new Error(`Pago ${paymentId} no encontrado en MercadoPago`);
        }

        console.log('💳 Información del pago MP:', {
            id: payment.id,
            status: payment.status,
            external_reference: payment.external_reference,
            transaction_amount: payment.transaction_amount
        });

        const sessionTokenOrOrderId = payment.external_reference;
        if (!sessionTokenOrOrderId) {
            throw new Error('External reference (sessionToken o orderID) no encontrado');
        }

        // 3. Buscar orden existente por transactionId o crear desde sesión
        let order = await prisma.order.findFirst({
            where: { transactionId: paymentId },
            include: {
                OrderItem: {
                    include: {
                        variant: true
                    }
                }
            }
        });

        // Si no hay orden, intentar crearla desde OrderSession
        if (!order) {
            console.log('📄 Orden no encontrada, intentando crear desde OrderSession...');
            const { createOrderFromSession } = await import('@/actions/checkout/create-order-from-session');
            const result = await createOrderFromSession(sessionTokenOrOrderId, paymentId);
            
            if (result.ok && result.orderId) {
                order = await prisma.order.findUnique({
                    where: { id: result.orderId },
                    include: {
                        OrderItem: {
                            include: {
                                variant: true
                            }
                        }
                    }
                });
            }
        }

        if (!order) {
            throw new Error(`No se pudo crear/encontrar orden para ${sessionTokenOrOrderId}`);
        }

        // 4. VERIFICAR SI EL FRONTEND YA PROCESÓ ESTA ORDEN ESPECÍFICA
        if (order.paymentStatus === 'approved' && order.isPaid) {
            console.log('✅ Orden ya procesada por frontend - webhook descartado');
            return { 
                status: 'already_processed_by_frontend', 
                orderId: order.id,
                message: 'Orden ya procesada por el frontend'
            };
        }

        // 5. Verificar que la orden esté en estado válido para actualizar
        if (order.orderStatus === 'cancelled' || order.orderStatus === 'expired') {
            console.log('⚠️  Orden está cancelada o expirada, no se puede procesar pago');
            return { 
                status: 'order_invalid', 
                orderId: order.id,
                orderStatus: order.orderStatus
            };
        }

        // 6. Verificar que los montos coincidan
        if (Math.abs(order.total - payment.transaction_amount!) > 0.01) {
            console.error('❌ Monto no coincide:', {
                orderTotal: order.total,
                paymentAmount: payment.transaction_amount
            });
            throw new Error('Monto del pago no coincide con la orden');
        }

        // 7. PROCESAR SOLO SI EL FRONTEND NO LO HIZO
        console.log('🔄 Frontend no procesó - webhook procesando pago');
        const result = await processPaymentByStatusHybrid(
            order,
            payment,
            paymentId
        );

        console.log('✅ Pago procesado exitosamente por webhook:', result);
        return result;

    } catch (error: any) {
        console.error('❌ Error procesando webhook:', error);
        
        // Log del error para debugging
        await logPaymentWebhookError(paymentId, error.message);
        
        throw error;
    }
}

/**
 * Procesa el pago según su estado en MercadoPago - FLUJO HÍBRIDO
 * Actualiza órdenes que no fueron procesadas por el frontend
 */
async function processPaymentByStatusHybrid(order: any, payment: any, paymentId: string) {
    return await prisma.$transaction(async (tx) => {
        
        switch (payment.status) {
            case 'approved':
                console.log('✅ Pago aprobado por webhook, actualizando orden a paid');
                
                // Actualizar orden a paid
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        orderStatus: 'paid',
                        isPaid: true,
                        paidAt: payment.date_approved ? new Date(payment.date_approved) : new Date(),
                        paymentStatus: 'approved',
                        transactionId: paymentId
                    }
                });

                // Descontar stock definitivamente y completar reservas
                await completeStockReservation(tx, order);

                return { 
                    status: 'approved_by_webhook', 
                    orderId: order.id,
                    message: 'Pago aprobado por webhook y stock actualizado'
                };

            case 'rejected':
            case 'cancelled':
                console.log('❌ Pago rechazado/cancelado por webhook');
                
                // Actualizar orden a cancelled
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        orderStatus: 'cancelled',
                        paymentStatus: payment.status,
                        transactionId: paymentId
                    }
                });

                // Liberar stock reservado
                await releaseStockReservation(tx, order);

                return { 
                    status: 'cancelled_by_webhook', 
                    orderId: order.id,
                    message: 'Pago cancelado por webhook y stock liberado'
                };

            case 'pending':
            case 'in_process':
                console.log('⏳ Pago pendiente por webhook');
                
                // Solo actualizar el payment ID para tracking
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: payment.status,
                        transactionId: paymentId
                    }
                });

                return { 
                    status: 'pending_by_webhook', 
                    orderId: order.id,
                    message: 'Pago en proceso de validación por webhook'
                };

            default:
                console.log('⚠️  Estado de pago desconocido por webhook:', payment.status);
                
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: payment.status,
                        transactionId: paymentId
                    }
                });

                return { 
                    status: 'unknown_by_webhook', 
                    orderId: order.id,
                    paymentStatus: payment.status
                };
        }
    });
}

/**
 * Completa la reserva de stock y descuenta definitivamente
 */
async function completeStockReservation(tx: any, order: any) {
    const stockReservationId = `order-${order.id}`;
    
    // Completar reservas de stock
    await tx.stockReservation.updateMany({
        where: {
            reservationId: stockReservationId,
            status: 'ACTIVE'
        },
        data: {
            status: 'COMPLETED',
            completedAt: new Date()
        }
    });

    // Descontar stock definitivamente
    for (const item of order.OrderItem) {
        await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
                stock: {
                    decrement: item.quantity
                }
            }
        });
    }

    console.log('📦 Stock descontado definitivamente para orden:', order.id);
}

/**
 * Libera la reserva de stock
 */
async function releaseStockReservation(tx: any, order: any) {
    const stockReservationId = `order-${order.id}`;
    
    await tx.stockReservation.updateMany({
        where: {
            reservationId: stockReservationId,
            status: 'ACTIVE'
        },
        data: {
            status: 'RELEASED',
            releasedAt: new Date()
        }
    });

    console.log('🔓 Stock liberado para orden:', order.id);
}

/**
 * Log de errores de webhook para debugging
 */
async function logPaymentWebhookError(paymentId: string, error: string) {
    try {
        // Podrías crear una tabla de logs si quieres persistir esto
        console.error('📝 Log de error webhook:', {
            paymentId,
            error,
            timestamp: new Date().toISOString()
        });
    } catch (logError) {
        console.error('Error logging webhook error:', logError);
    }
}