'use server'

import { Address, PaymentMethod } from "@/interfaces";
import {prisma} from "@/lib/prisma";

interface ProductToOrder {
  variantId: string;
  quantity: number;
}

interface OrderData {
  products: any[];
  orderItems: any[];
  itemsInOrder: number;
  subTotal: number;
  tax: number;
  discounts: number;
  total: number;
  description: string;
  stockValidation: any[];
  userId: string;
  selectedPayment: PaymentMethod;
  address: Address;
}

export async function createOrderAfterPayment(orderData: OrderData, transactionId: string) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // 0. Obtener la empresa por defecto (asumiendo que hay una)
            const defaultCompany = await tx.company.findFirst();
            if (!defaultCompany) {
                throw new Error('No se encontró una empresa configurada');
            }

            // 1. Verificar stock nuevamente (por si cambió mientras el usuario estaba pagando)
            const currentProducts = await tx.productVariant.findMany({
                where: {
                    id: {
                        in: orderData.products.map(p => p.id)
                    }
                },
                select: {
                    id: true,
                    stock: true,
                    sku: true
                }
            });

            // Validar stock actual
            for (const validation of orderData.stockValidation) {
                const currentProduct = currentProducts.find(p => p.id === validation.productId);
                if (!currentProduct) {
                    throw new Error(`Producto ${validation.productId} no encontrado`);
                }
                if (currentProduct.stock < validation.requested) {
                    throw new Error(`Producto ${currentProduct.sku} no tiene suficiente stock. Stock disponible: ${currentProduct.stock}, solicitado: ${validation.requested}`);
                }
            }

            // 2. Crear la orden
            const orderItemsData = orderData.orderItems.map(item => ({
                quantity: item.quantity,
                variantId: item.product.id,
                productId: item.product.product.id,
                price: item.price,
                discount: item.discount * item.quantity
            }));

            const order = await tx.order.create({
                data: {
                    userId: orderData.userId,
                    companyId: defaultCompany.id,
                    itemsInOrder: orderData.itemsInOrder,
                    subTotal: orderData.subTotal,
                    tax: orderData.tax,
                    discounts: orderData.discounts,
                    total: orderData.total,
                    paymentMethodId: orderData.selectedPayment.id,
                    transactionId: transactionId,
                    isPaid: true,
                    paidAt: new Date(),
                    paymentStatus: 'paid',
                    OrderItem: {
                        createMany: {
                            data: orderItemsData
                        }
                    }
                }
            });

            // 3. Crear dirección de la orden
            const orderAddress = await tx.orderAddress.create({
                data: {
                    orderId: order.id,
                    firstName: orderData.address.firstName,
                    lastName: orderData.address.lastName,
                    address: orderData.address.address,
                    address2: orderData.address.address2,
                    postalCode: orderData.address.postalCode,
                    city: orderData.address.city,
                    countryId: orderData.address.country,
                    phone: orderData.address.phone
                }
            });

            // 4. Actualizar stock
            const stockUpdates = orderData.stockValidation.map(validation => 
                tx.productVariant.update({
                    where: { id: validation.productId },
                    data: {
                        stock: {
                            decrement: validation.requested
                        }
                    }
                })
            );

            await Promise.all(stockUpdates);

            // 5. Crear descuentos (si los hay)
            const orderItems = await tx.orderItem.findMany({
                where: { orderId: order.id }
            });

            // Descuentos por variante
            const variantDiscounts = orderItems.map(item => {
                const orderItem = orderData.orderItems.find(oi => oi.product.id === item.variantId);
                const discountPercent = orderItem?.product?.discountPercent ?? 0;
                return {
                    orderId: order.id,
                    orderItemId: item.id,
                    type: 'variant',
                    amount: item.discount,
                    percent: discountPercent,
                    description: discountPercent > 0 ? `Descuento variante ${discountPercent}%` : undefined
                };
            }).filter(d => d.amount > 0);

            // Descuento por método de pago
            const paymentDiscount = orderData.selectedPayment.discountPercent 
                ? (orderData.subTotal - orderData.orderItems.reduce((sum, item) => sum + (item.discount * item.quantity), 0)) * (orderData.selectedPayment.discountPercent / 100)
                : 0;

            let paymentDiscounts: any[] = [];
            if (paymentDiscount > 0) {
                paymentDiscounts = [{
                    orderId: order.id,
                    type: 'payment',
                    amount: paymentDiscount,
                    percent: orderData.selectedPayment.discountPercent,
                    description: `Descuento por método de pago (${orderData.selectedPayment.name})`
                }];
            }

            // Insertar descuentos
            if (variantDiscounts.length > 0 || paymentDiscounts.length > 0) {
                await tx.orderDiscount.createMany({
                    data: [...variantDiscounts, ...paymentDiscounts]
                });
            }

            return {
                order,
                orderAddress
            };
        });

        return {
            ok: true,
            order: result.order,
            orderAddress: result.orderAddress
        };

    } catch (error: any) {
        console.error('Error creating order after payment:', error);
        
        if (error.message && error.message.includes('Producto')) {
            return {
                ok: false,
                error: error.message
            }
        }
        
        return {
            ok: false,
            error: 'Error al crear la orden después del pago. Contacta al soporte.'
        }
    }
}