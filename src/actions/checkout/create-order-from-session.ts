'use server'

import prisma from '@/lib/prisma';

interface CreateOrderFromSessionResult {
    ok: boolean;
    error?: string;
    orderId?: string;
    message?: string;
}

/**
 * Crea una Order real a partir de una OrderSession cuando el pago es confirmado
 * @param sessionToken Token de la OrderSession
 * @param paymentId ID del pago de MercadoPago
 * @returns Resultado de la creación de la orden
 */
export const createOrderFromSession = async (
    sessionToken: string, 
    paymentId: string
): Promise<CreateOrderFromSessionResult> => {
    try {
        console.log(`🔄 Creando Order desde OrderSession: ${sessionToken}`);

        return await prisma.$transaction(async (tx) => {
            // 1. Buscar la OrderSession
            const orderSession = await tx.orderSession.findUnique({
                where: { sessionToken },
                include: {
                    user: true,
                    company: true,
                    paymentMethod: true
                }
            });

            if (!orderSession) {
                return { ok: false, error: 'Sesión de checkout no encontrada' };
            }

            // 2. Verificar que la sesión no haya expirado
            if (orderSession.expiresAt < new Date()) {
                return { ok: false, error: 'Sesión de checkout expirada' };
            }

            // 3. Verificar que no haya sido procesada ya
            if (orderSession.isProcessed) {
                return { ok: false, error: 'Sesión ya procesada anteriormente' };
            }

            // 4. Parsear datos JSON de la sesión
            const addressData = JSON.parse(orderSession.address as string);
            const cartItemsData = JSON.parse(orderSession.cartItems as string);

            // 5. Crear la Order real
            const order = await tx.order.create({
                data: {
                    userId: orderSession.userId,
                    companyId: orderSession.companyId,
                    paymentMethodId: orderSession.paymentMethodId,
                    subTotal: orderSession.subTotal,
                    tax: orderSession.tax,
                    total: orderSession.total,
                    discounts: orderSession.discounts,
                    deliveryMethod: orderSession.deliveryMethod,
                    shippingCost: orderSession.shippingCost,
                    shippingMethod: orderSession.shippingMethod,
                    freeShipping: orderSession.freeShipping,
                    itemsInOrder: cartItemsData.reduce((sum: number, item: any) => sum + item.quantity, 0),
                    orderStatus: 'paid', // Ya fue pagado
                    isPaid: true,
                    paidAt: new Date(),
                    transactionId: paymentId
                }
            });

            console.log(`✅ Order creada con ID: ${order.id}`);

            // 6. Crear OrderItems
            for (const cartItem of cartItemsData) {
                const createdOrderItem = await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        variantId: cartItem.variantId,
                        productId: cartItem.productId,
                        quantity: cartItem.quantity,
                        price: cartItem.originalPrice,
                        discount: cartItem.discountAmount
                    }
                });

                // Crear OrderDiscount para variante si aplica
                if (cartItem.discountAmount > 0 && cartItem.discountType) {
                    await tx.orderDiscount.create({
                        data: {
                            orderId: order.id,
                            orderItemId: createdOrderItem.id,
                            type: cartItem.discountType,
                            amount: cartItem.discountAmount * cartItem.quantity,
                            percent: cartItem.discountPercentage,
                            description: cartItem.discountDescription
                        }
                    });
                }
            }

            // 7. Crear OrderAddress
            await tx.orderAddress.create({
                data: {
                    orderId: order.id,
                    firstName: addressData.firstName,
                    lastName: addressData.lastName,
                    address: addressData.address,
                    address2: addressData.address2,
                    postalCode: addressData.postalCode,
                    city: addressData.city,
                    phone: addressData.phone,
                    countryId: addressData.countryId
                }
            });

            // 8. Crear OrderDiscount para método de pago si aplica
            if (orderSession.paymentMethod.discountPercent && orderSession.paymentMethod.discountPercent > 0) {
                const paymentDiscountAmount = orderSession.subTotal * (orderSession.paymentMethod.discountPercent / 100);
                
                await tx.orderDiscount.create({
                    data: {
                        orderId: order.id,
                        orderItemId: null,
                        type: 'payment',
                        amount: paymentDiscountAmount,
                        percent: orderSession.paymentMethod.discountPercent,
                        description: `Descuento por método de pago: ${orderSession.paymentMethod.discountPercent}%`
                    }
                });
            }

            // 9. Convertir reservas temporales en definitivas
            await tx.stockReservation.updateMany({
                where: {
                    orderKey: sessionToken,
                    status: 'ACTIVE'
                },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    orderKey: order.id // Actualizar orderKey al ID de la orden real
                }
            });

            // 10. Descontar stock definitivamente
            for (const cartItem of cartItemsData) {
                await tx.productVariant.update({
                    where: { id: cartItem.variantId },
                    data: {
                        stock: {
                            decrement: cartItem.quantity
                        }
                    }
                });
            }

            // 11. Marcar OrderSession como procesada
            await tx.orderSession.update({
                where: { id: orderSession.id },
                data: { 
                    isProcessed: true,
                    updatedAt: new Date()
                }
            });

            console.log(`✅ OrderSession ${sessionToken} marcada como procesada`);

            return {
                ok: true,
                orderId: order.id,
                message: 'Orden creada exitosamente desde sesión'
            };
        });

    } catch (error: any) {
        console.error('❌ Error creando orden desde sesión:', error);
        return {
            ok: false,
            error: error.message || 'Error interno al crear la orden'
        };
    }
};