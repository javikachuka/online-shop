'use server'

import prisma from "@/lib/prisma";
import { validateMercadoPagoPayment } from "../payments/validate-mercadopago-payment";
import { auth } from "@/auth.config";
import { 
    reserveStock, 
    completeStockReservation, 
    releaseStockReservation,
    type ReserveStockItem 
} from "../stock/stock-reservation";
import { ensureStockCleanup } from "../stock/stock-cleanup";

interface OrderResult {
    ok: boolean;
    message?: string;
    error?: string;
    orderId?: string;
    redirectTo?: string;
    reservationId?: string;
}

/**
 * Reserva stock para el checkout - paso 1
 */
export const reserveStockForCheckout = async (
    cartItems: any[]
): Promise<OrderResult> => {
    try {
        // Limpiar reservas expiradas ocasionalmente
        await ensureStockCleanup();

        // Obtener usuario autenticado
        const session = await auth();
        const userId = session?.user?.id;
        
        if (!userId) {
            return {
                ok: false,
                error: 'User not authenticated'
            };
        }

        // Convertir items del carrito al formato de reserva
        const stockItems: ReserveStockItem[] = cartItems.map(item => ({
            variantId: item.variantId,
            quantity: item.quantity
        }));

        // Reservar stock por 15 minutos
        const reservation = await reserveStock(
            userId,
            stockItems,
            'checkout',
            undefined,
            15 // 15 minutos de reserva
        );

        if (!reservation.ok) {
            return {
                ok: false,
                error: reservation.error,
                message: reservation.message
            };
        }

        console.log('Stock reserved successfully:', reservation.reservationId);
        
        return {
            ok: true,
            message: 'Stock reservado por 15 minutos',
            reservationId: reservation.reservationId
        };

    } catch (error) {
        console.error('Error reserving stock for checkout:', error);
        return {
            ok: false,
            error: 'Failed to reserve stock'
        };
    }
};

/**
 * Procesa una orden con stock ya reservado
 */
export const processOrderWithReservedStock = async (
    paymentId: string,
    reservationId: string,
    orderData: any
): Promise<OrderResult> => {
    if (!paymentId || !reservationId) {
        return {
            ok: false,
            error: 'Payment ID and reservation ID are required'
        };
    }

    if (!orderData) {
        return {
            ok: false,
            error: 'Order data is required'
        };
    }

    try {
        console.log('Processing order with reserved stock:', { paymentId, reservationId });

        // 1. Validar el pago con Mercado Pago
        const paymentValidation = await validateMercadoPagoPayment(paymentId);

        if (!paymentValidation.ok) {
            console.error('Payment validation failed - releasing reservation:', paymentValidation.error);
            // Liberar la reserva si el pago falló
            await releaseStockReservation(reservationId);
            return {
                ok: false,
                error: paymentValidation.error || 'Payment validation failed',
                message: paymentValidation.message
            };
        }

        // 2. Verificar que el pago fue aprobado
        if (paymentValidation.paymentData?.status !== 'approved') {
            if (paymentValidation.paymentData?.status === 'pending') {
                return {
                    ok: true,
                    message: 'Pago pendiente de aprobación',
                    redirectTo: `/orders/payment-pending?payment=${paymentId}`
                };
            } else {
                console.log('Payment not approved - releasing reservation');
                await releaseStockReservation(reservationId);
                return {
                    ok: false,
                    error: `Payment ${paymentValidation.paymentData?.status || 'failed'}`,
                    message: paymentValidation.message || 'El pago no pudo ser procesado'
                };
            }
        }

        // 3. Obtener datos del usuario autenticado
        const session = await auth();
        const userId = session?.user?.id;
        
        if (!userId) {
            await releaseStockReservation(reservationId);
            return {
                ok: false,
                error: 'User not authenticated'
            };
        }

        // 4. Validar que los montos coincidan
        const expectedAmount = orderData.total;
        const receivedAmount = paymentValidation.paymentData?.amount || 0;
        
        if (Math.abs(expectedAmount - receivedAmount) > 0.01) {
            console.error('Amount mismatch:', { expectedAmount, receivedAmount });
            await releaseStockReservation(reservationId);
            return {
                ok: false,
                error: 'Payment amount does not match order total'
            };
        }

        // 5. Crear la orden con stock reservado
        try {
            const orderId = await createOrderWithReservedStock(
                userId,
                reservationId,
                paymentValidation.paymentData,
                orderData.cartItems,
                orderData.address,
                orderData.paymentMethodId
            );

            console.log('Order created successfully with reserved stock:', {
                orderId,
                reservationId,
                paymentId,
                paymentAmount: paymentValidation.paymentData?.amount
            });

            return {
                ok: true,
                message: 'Pago procesado y orden creada exitosamente',
                orderId,
                redirectTo: `/orders/${orderId}`
            };

        } catch (orderError) {
            console.error('Error creating order - releasing reservation:', orderError);
            await releaseStockReservation(reservationId);
            return {
                ok: false,
                error: 'Payment validated but failed to create order. Stock has been released. Please try again.'
            };
        }

    } catch (error) {
        console.error('Error processing order with reserved stock:', error);
        await releaseStockReservation(reservationId);
        return {
            ok: false,
            error: 'Internal error processing order'
        };
    }
};

/**
 * Crea una orden usando stock previamente reservado
 */
export const createOrderWithReservedStock = async (
    userId: string,
    reservationId: string,
    paymentData: any,
    orderItems: any[],
    address: any,
    paymentMethodId: string
) => {
    try {
        // Obtener una empresa por defecto o crear una básica
        let companyId: string;
        
        const defaultCompany = await prisma.company.findFirst({
            where: { isDefault: true },
            select: { id: true }
        });

        if (defaultCompany) {
            companyId = defaultCompany.id;
        } else {
            // Crear una empresa básica temporal si no existe ninguna
            const basicCompany = await prisma.company.create({
                data: {
                    name: 'Tienda Online',
                    slug: 'tienda-online',
                    tradeName: 'Tienda Online',
                    email: 'info@tienda.com',
                    phone: '+54 11 0000 0000',
                    isDefault: true,
                    isActive: true
                }
            });
            companyId = basicCompany.id;
        }

        // Calcular totales
        const subTotal = orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        const tax = 0; // Simplificado, sin impuestos por ahora
        const discounts = 0; // Simplificado, sin descuentos complejos
        const total = subTotal + tax - discounts;
        const itemsInOrder = orderItems.reduce((total, item) => total + item.quantity, 0);

        // Crear la orden usando transacción
        const orderId = await prisma.$transaction(async (tx) => {
            // 1. Verificar que la reserva existe y está activa
            const reservations = await tx.stockReservation.findMany({
                where: {
                    reservationId,
                    status: 'ACTIVE',
                    userId,
                    expiresAt: { gt: new Date() }
                },
                include: {
                    variant: true
                }
            });

            if (reservations.length === 0) {
                throw new Error('No valid stock reservation found');
            }

            // 2. Crear la orden
            const order = await tx.order.create({
                data: {
                    userId,
                    companyId,
                    paymentMethodId,
                    subTotal,
                    tax,
                    total,
                    discounts,
                    itemsInOrder,
                    isPaid: true,
                    paidAt: new Date(paymentData.dateApproved || Date.now()),
                    paymentStatus: 'approved',
                    transactionId: paymentData.transactionId
                }
            });

            // 3. Crear los items de la orden usando las reservas
            const reservationMap = new Map();
            reservations.forEach(res => {
                reservationMap.set(res.variantId, res.quantity);
            });

            for (const item of orderItems) {
                const reservedQuantity = reservationMap.get(item.variantId);
                
                if (!reservedQuantity || reservedQuantity < item.quantity) {
                    throw new Error(`Invalid reservation for variant ${item.variantId}`);
                }

                // Obtener productId
                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId },
                    select: { productId: true }
                });

                if (!variant) {
                    throw new Error(`Variant ${item.variantId} not found`);
                }

                // Crear el item de la orden
                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        variantId: item.variantId,
                        productId: variant.productId,
                        quantity: item.quantity,
                        price: item.price,
                        discount: 0 // Simplificado
                    }
                });

                // Actualizar stock real (el stock ya estaba "reservado")
                await tx.productVariant.update({
                    where: { id: item.variantId },
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                });
            }

            // 4. Completar la reserva de stock
            await tx.stockReservation.updateMany({
                where: {
                    reservationId,
                    status: 'ACTIVE'
                },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            });

            // 5. Crear la dirección de la orden
            await tx.orderAddress.create({
                data: {
                    orderId: order.id,
                    firstName: address.firstName,
                    lastName: address.lastName,
                    address: address.address,
                    address2: address.address2,
                    postalCode: address.postalCode,
                    city: address.city,
                    phone: address.phone,
                    countryId: address.countryId
                }
            });

            return order.id;
        });

        return orderId;

    } catch (error) {
        console.error('Error creating order with reserved stock:', error);
        throw error;
    }
};

/**
 * Libera una reserva de stock (para cancelaciones)
 */
export const cancelStockReservation = async (
    reservationId: string
): Promise<OrderResult> => {
    try {
        const result = await releaseStockReservation(reservationId);
        
        if (!result.ok) {
            return {
                ok: false,
                error: result.error
            };
        }

        return {
            ok: true,
            message: 'Stock reservation released successfully'
        };

    } catch (error) {
        console.error('Error canceling stock reservation:', error);
        return {
            ok: false,
            error: 'Failed to cancel reservation'
        };
    }
};