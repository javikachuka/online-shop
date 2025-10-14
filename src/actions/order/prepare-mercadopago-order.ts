'use server'

import { auth } from "@/auth.config";
import { Address, PaymentMethod } from "@/interfaces";
import prisma from "@/lib/prisma";


interface ProductToOrder {
  variantId: string;
  quantity: number;
}

export async function prepareMercadoPagoOrder(productIds: ProductToOrder[], address: Address, selectedPayment: PaymentMethod) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        return {
            ok: false,
            error: 'User not authenticated'
        }
    }

    if (!selectedPayment) {
        return {
            ok: false,
            error: 'You must select a method payment'
        }
    }

    try {
        console.log(productIds);
        
        // 1. Validar productos y obtener precios actuales de la base de datos
        const products = await prisma.productVariant.findMany({
            where: {
                id: {
                    in: productIds.map(product => product.variantId)
                }
            },
            select: {
                id: true,
                sku: true,
                price: true,
                stock: true,
                discountPercent: true,
                product: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                    }
                },
            }
        });

        console.log(products);
        
        if (products.length !== productIds.length) {
            return {
                ok: false,
                error: 'Algunos productos no fueron encontrados'
            }
        }

        // 2. Calcular totales con precios de base de datos
        let itemsInOrder = 0;
        let subTotal = 0;
        let discounts = 0;
        
        const orderItems = productIds.map(p => {
            const product = products.find(product => product.id === p.variantId);
            if (!product) {
                throw new Error(`Producto ${p.variantId} no encontrado`);
            }
            
            const itemQuantity = p.quantity;
            const itemPrice = product.price;
            const itemDiscount = product.discountPercent ? (itemPrice * (product.discountPercent / 100)) : 0;
            const itemSubtotal = itemPrice * itemQuantity;
            const itemTotalDiscount = itemDiscount * itemQuantity;
            
            itemsInOrder += itemQuantity;
            subTotal += itemSubtotal;
            discounts += itemTotalDiscount;
            
            return {
                product,
                quantity: itemQuantity,
                price: itemPrice,
                discount: itemDiscount,
                subtotal: itemSubtotal
            };
        });

        // 3. Aplicar descuento por método de pago
        const paymentDiscount = selectedPayment.discountPercent 
            ? (subTotal - discounts) * (selectedPayment.discountPercent / 100)
            : 0;
        
        discounts += paymentDiscount;
        
        // 4. Calcular total final
        const tax = 0; // Ajustar si manejas impuestos
        const total = subTotal - discounts + tax;

        // 5. Crear descripción para Mercado Pago
        const description = orderItems
            .map(item => `${item.product.product.title} x${item.quantity}`)
            .join(', ');

        // 6. Verificar stock
        const stockValidation = productIds.map(p => {
            const product = products.find(product => product.id === p.variantId);
            if (!product) {
                throw new Error(`Producto ${p.variantId} no encontrado`);
            }
            if (product.stock < p.quantity) {
                throw new Error(`Producto ${product.sku} no tiene suficiente stock. Stock disponible: ${product.stock}, solicitado: ${p.quantity}`);
            }
            return { productId: p.variantId, stock: product.stock, requested: p.quantity };
        });

        return {
            ok: true,
            orderData: {
                products,
                orderItems,
                itemsInOrder,
                subTotal,
                tax,
                discounts,
                total,
                description,
                stockValidation,
                userId,
                selectedPayment,
                address
            }
        };

    } catch (error: any) {
        console.error('Error preparing MercadoPago order:', error);
        
        if (error.message && error.message.includes('Producto')) {
            return {
                ok: false,
                error: error.message
            }
        }
        
        return {
            ok: false,
            error: 'Error al preparar el pedido. Intenta nuevamente.'
        }
    }
}