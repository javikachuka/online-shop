'use server'

import { auth } from "@/auth.config";
import { Address, PaymentMethod } from "@/interfaces";
import { calculateShippingCost } from "@/actions/shipping/calculate-shipping";
import {prisma} from "@/lib/prisma";


interface ProductToOrder {
  variantId: string;
  quantity: number;
}

export async function placeOrder(productIds: ProductToOrder[], address: Address, selectedPayment: PaymentMethod ) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        return {
            ok: false,
            error: 'User not authenticated'
        }
    }

    if(!selectedPayment){
        return {
            ok: false,
            error: 'You must select a method payment'
        }
    }

    console.log("productsID",productIds.map(product => product.variantId));
    
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
    

    const itemsInOrder = productIds.reduce(( count, product) => count + product.quantity, 0);

    const {subTotal, tax, total: totalSinMetodoPago, discounts: discountsPorVariante} = productIds.reduce((totals, item) => {

        const productQuantity = item.quantity;
        const product = products.find(p => p.id === item.variantId);
        
        if(!product) {
            throw new Error(`Producto ${item.variantId} no encontrado`);
        }

        const subTotal = productQuantity * product.price;
        const discount = product.discountPercent ? (product.price * (product.discountPercent / 100)) : 0

        totals.subTotal += subTotal;
        // totals.tax += subTotal * 0.21; // Assuming a tax rate of 21%
        totals.tax += 0; // TODO - Temporarily set to 0, adjust as needed
        // totals.total += subTotal + (subTotal * 0.21);

        totals.discounts = totals.discounts ? totals.discounts + (discount * productQuantity) : (discount * productQuantity)

        totals.total += subTotal + 0 - (discount * productQuantity); // subtotal + tax - discounts

        return totals;
    }, { subTotal: 0, tax: 0, discounts: 0 ,total: 0 });

    // Calcular costo de envío
    const shippingInfo = await calculateShippingCost(address, subTotal, discountsPorVariante);

    // Descuento por método de pago (SOLO sobre productos, NO sobre envío)
    let paymentDiscount = 0;
    if (selectedPayment.discountPercent && selectedPayment.discountPercent > 0) {
        paymentDiscount = ((subTotal - discountsPorVariante) * (selectedPayment.discountPercent / 100));
    }

    // Suma total de descuentos (variante + método de pago)
    const discounts = discountsPorVariante + paymentDiscount;
    const total = subTotal + tax + shippingInfo.cost - discounts;

    console.log({subTotal, tax, shippingCost: shippingInfo.cost, freeShipping: shippingInfo.isFree, total, discounts, discountsPorVariante, paymentDiscount});

    try {
        const prismaTx = await prisma.$transaction( async (tx) => {

            const defaultCompany = await tx.company.findFirst();
            if (!defaultCompany) {
                throw new Error('No se encontró una empresa configurada');
            }
            //1. actualizar el stock de productos
            const updateStockPromises = products.map(async (product) => {
                const productQuantity = productIds.filter(p => p.variantId === product.id)
                    .reduce((total, p) => total + p.quantity, 0);
                if(productQuantity === 0) {
                    throw new Error(`Producto ${product.id} no tiene cantidad a actualizar`);
                }
                return tx.productVariant.update({
                    where: { id: product.id },
                    data: {
                        stock: {
                            decrement: productQuantity
                        }
                    }
                });
            });
            
            const updatedProducts = await Promise.all(updateStockPromises);
    
            updatedProducts.forEach(product => {
                if(product.stock < 0){
                    throw new Error(`Producto ${product.sku} no tiene suficiente stock`)
                }
            });
    
            //2. crear orden
            // Prepara los datos de los items con descuento por variante
            const orderItemsData = productIds.map(p => {
                const product = products.find(product => product.id === p.variantId);
                const discount = product && product.discountPercent ? (product.price * (product.discountPercent / 100)) : 0;
                return {
                    quantity: p.quantity,
                    variantId: p.variantId,
                    productId: product?.product.id ?? '',
                    price: product?.price ?? 0,
                    discount: discount * p.quantity
                };
            });

            const order = await tx.order.create({
                data: {
                    userId: userId,
                    itemsInOrder: itemsInOrder,
                    subTotal: subTotal,
                    tax: tax,
                    discounts: discounts,
                    total: total,
                    deliveryMethod: address.deliveryMethod || 'delivery',
                    shippingCost: shippingInfo.cost,
                    freeShipping: shippingInfo.isFree,
                    shippingMethod: shippingInfo.method,
                    paymentMethodId: selectedPayment.id,
                    companyId: defaultCompany.id,
                    OrderItem: {
                        createMany: {
                            data: orderItemsData
                        }
                    }
                }
            });

            // Obtener los OrderItems recién creados
            const orderItems = await tx.orderItem.findMany({
                where: { orderId: order.id }
            });

            // Crear registros en OrderDiscount para cada item (descuento por variante)
            const orderDiscountsVariant = orderItems.map(item => {
                const product = products.find(product => product.id === item.variantId);
                const percent = product?.discountPercent ?? 0;
                return {
                    orderId: order.id,
                    orderItemId: item.id,
                    type: 'variant',
                    amount: item.discount,
                    percent: percent,
                    description: percent > 0 ? `Descuento variante ${percent}%` : undefined
                };
            }).filter(d => d.amount > 0);

            // Crear registro en OrderDiscount para el descuento por método de pago
            let orderDiscountsPayment: any[] = [];
            if (paymentDiscount > 0) {
                orderDiscountsPayment = [{
                    orderId: order.id,
                    type: 'payment',
                    amount: paymentDiscount,
                    percent: selectedPayment.discountPercent,
                    description: `Descuento por método de pago (${selectedPayment.name})`
                }];
            }

            // Insertar todos los descuentos
            if (orderDiscountsVariant.length > 0 || orderDiscountsPayment.length > 0) {
                await tx.orderDiscount.createMany({
                    data: [...orderDiscountsVariant, ...orderDiscountsPayment]
                });
            }
    
            //3. crear direccion de orden
            
            const orderAddress = await tx.orderAddress.create({
                data: {
                    orderId: order.id,
                    firstName: address.firstName,
                    lastName: address.lastName,
                    address: address.address,
                    address2: address.address2,
                    postalCode: address.postalCode,
                    city: address.city,
                    countryId: address.country,
                    phone: address.phone
                }
            })
    
    
    
            return {
                updatedProducts,
                order,
                orderAddress
            }
    
        })

        return {
            ok: true,
            order: prismaTx.order,
            prismaTx: prismaTx
        }
    } catch (error: any) {
        console.log(error.message);
        
        // Errores de stock o cantidad insuficiente
        if (error.message && (error.message.includes('Producto'))) {
            return {
                ok: false,
                message: error.message
            }
        }
        // Errores de base de datos u otros
        return {
            ok: false,
            message: 'Ocurrió un error al procesar la orden. Intenta nuevamente.'
        }
    }

    

}
// This function simulates placing an order by sending a POST request to an API endpoint.