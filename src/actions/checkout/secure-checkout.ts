'use server'

import {prisma} from "@/lib/prisma";
import { auth } from "@/auth.config";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { Address } from "@/interfaces";
import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { runOpportunisticSessionCleanup } from "./opportunistic-session-cleanup";

const mercadopago = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!
});

// Función auxiliar para generar token único de sesión
function generateSessionToken(): string {
    return `session_${randomBytes(16).toString('hex')}_${Date.now()}`;
}

interface CheckoutItem {
    variantId: string;
    quantity: number;
}

interface StoredSessionCartItem {
    variantId: string;
    quantity: number;
    originalPrice?: number;
}

const parseStoredJson = <T>(value: unknown): T => {
    if (typeof value === 'string') {
        return JSON.parse(value) as T;
    }

    return value as T;
};

const buildItemsSignature = (items: Array<{ variantId: string; quantity: number }>) => {
    return JSON.stringify(
        [...items]
            .map((item) => ({
                variantId: item.variantId,
                quantity: item.quantity,
            }))
            .sort((a, b) => a.variantId.localeCompare(b.variantId))
    );
};

const buildAddressSignature = (address: Partial<Address> & { countryId?: string }) => {
    return JSON.stringify({
        firstName: address.firstName ?? '',
        lastName: address.lastName ?? '',
        address: address.address ?? '',
        address2: address.address2 ?? '',
        postalCode: address.postalCode ?? '',
        city: address.city ?? '',
        phone: address.phone ?? '',
        countryId: address.countryId ?? address.country ?? '',
        deliveryMethod: address.deliveryMethod ?? 'delivery',
    });
};

interface SecureCheckoutResult {
    ok: boolean;
    error?: string;
    sessionToken?: string; // Cambiar orderId por sessionToken
    mpRedirectUrl?: string;
    reservationExpiresAt?: Date;
}

const SERIALIZABLE_MAX_RETRIES = 3;

const isSerializableConflict = (error: unknown) => {
    return (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
    );
};

const runSerializableCheckoutTransaction = async <T>(
    transactionFn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= SERIALIZABLE_MAX_RETRIES; attempt++) {
        try {
            return await prisma.$transaction(transactionFn, {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            });
        } catch (error) {
            if (!isSerializableConflict(error) || attempt === SERIALIZABLE_MAX_RETRIES) {
                throw error;
            }

            lastError = error;
            console.warn(`🔁 Reintentando checkout por conflicto de concurrencia (intento ${attempt}/${SERIALIZABLE_MAX_RETRIES})`);
        }
    }

    throw lastError;
};

/**
 * Flujo seguro de checkout con OrderSession:
 * 1. Valida stock y precios desde BD
 * 2. Crea OrderSession temporal (NO Order todavía)
 * 3. Reserva stock temporal por 15 minutos
 * 4. Genera preferencia de MercadoPago
 * 5. Order se crea solo cuando pago es confirmado
 */
export const createSecureCheckout = async (
    items: CheckoutItem[],
    address: Address,
    paymentMethodId: string
): Promise<SecureCheckoutResult> => {
    
    if (!items.length) {
        return { ok: false, error: 'No hay productos en el carrito' };
    }

    if(!address) {
        return { ok: false, error: 'Dirección de envío no válida' };
    }

    try {
        // 1. Verificar autenticación
        const session = await auth();
        if (!session?.user?.id) {
            return { ok: false, error: 'Usuario no autenticado' };
        }

        const userId = session.user.id;
        console.log('🚀 Iniciando checkout seguro para usuario:', userId);

        await runOpportunisticSessionCleanup('secure-checkout');

        // 2. Usar transacción SERIALIZABLE para evitar sobreventa por concurrencia
        const result = await runSerializableCheckoutTransaction(async (tx) => {

            // 2.2 Obtener productos con precios actuales de BD
            const variants = await tx.productVariant.findMany({
                where: {
                    id: { in: items.map(item => item.variantId) }
                },
                include: {
                    product: true
                }
            });

            if (variants.length !== items.length) {
                throw new Error('Algunos productos no están disponibles');
            }

            const requestedItemsSignature = buildItemsSignature(items);
            const requestedAddressSignature = buildAddressSignature({
                ...address,
                countryId: address.country
            });

            const activeOrderSessions = await tx.orderSession.findMany({
                where: {
                    userId,
                    paymentMethodId,
                    isProcessed: false,
                    expiresAt: { gt: new Date() }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            const reusableSession = activeOrderSessions.find((session) => {
                const storedItems = parseStoredJson<StoredSessionCartItem[]>(session.cartItems);
                const storedAddress = parseStoredJson<Partial<Address> & { countryId?: string }>(session.address);

                return (
                    buildItemsSignature(storedItems) === requestedItemsSignature &&
                    buildAddressSignature(storedAddress) === requestedAddressSignature
                );
            });

            if (reusableSession) {
                const duplicateSessions = activeOrderSessions.filter(
                    (session) => session.id !== reusableSession.id
                );

                if (duplicateSessions.length > 0) {
                    const releasedAt = new Date();

                    for (const duplicateSession of duplicateSessions) {
                        await tx.stockReservation.updateMany({
                            where: {
                                orderKey: duplicateSession.sessionToken,
                                status: 'ACTIVE'
                            },
                            data: {
                                status: 'RELEASED',
                                releasedAt
                            }
                        });

                        await tx.orderSession.update({
                            where: { id: duplicateSession.id },
                            data: {
                                expiresAt: releasedAt,
                                updatedAt: releasedAt
                            }
                        });
                    }
                }

                console.log('♻️ Reutilizando OrderSession activa:', reusableSession.sessionToken);

                const storedItems = parseStoredJson<StoredSessionCartItem[]>(reusableSession.cartItems);

                return {
                    sessionToken: reusableSession.sessionToken,
                    total: reusableSession.total,
                    reservationExpiresAt: reusableSession.expiresAt,
                    orderItems: storedItems.map((item) => {
                        const variant = variants.find((v) => v.id === item.variantId);

                        return {
                            title: variant?.product.title || 'Producto',
                            quantity: item.quantity,
                            price: Number(item.originalPrice ?? variant?.price ?? 0)
                        };
                    })
                };
            }

            if (activeOrderSessions.length > 0) {
                const releasedAt = new Date();

                for (const activeSession of activeOrderSessions) {
                    await tx.stockReservation.updateMany({
                        where: {
                            orderKey: activeSession.sessionToken,
                            status: 'ACTIVE'
                        },
                        data: {
                            status: 'RELEASED',
                            releasedAt
                        }
                    });

                    await tx.orderSession.update({
                        where: { id: activeSession.id },
                        data: {
                            expiresAt: releasedAt,
                            updatedAt: releasedAt
                        }
                    });
                }

                console.log(`🔓 Liberadas ${activeOrderSessions.length} sesiones activas previas para regenerar checkout`);
            }

            // 2.3 Validar stock disponible en lote considerando reservas activas
            const now = new Date();
            const reservationSums = await tx.stockReservation.groupBy({
                by: ['variantId'],
                where: {
                    variantId: { in: items.map((item) => item.variantId) },
                    status: 'ACTIVE',
                    expiresAt: { gt: now },
                },
                _sum: { quantity: true },
            });

            const reservedByVariant = new Map(
                reservationSums.map((entry) => [entry.variantId, entry._sum.quantity || 0])
            );

            for (const item of items) {
                const variant = variants.find((v) => v.id === item.variantId);
                if (!variant) {
                    throw new Error(`Producto ${item.variantId} no encontrado`);
                }

                const reservedStock = reservedByVariant.get(item.variantId) || 0;
                const availableStock = variant.stock - reservedStock;

                if (availableStock < item.quantity) {
                    throw new Error(
                        `Stock insuficiente para ${variant.product.title}. ` +
                        `Disponible: ${availableStock}, Solicitado: ${item.quantity}`
                    );
                }
            }

            // 2.4 Calcular precios y descuentos desde BD (variantes y método de pago)
            const orderItems: Array<{
                variantId: string;
                productId: string;
                quantity: number;
                originalPrice: number;
                finalPrice: number;
                discountAmount: number;
                discountPercentage: number;
                discountType: string | null;
                discountDescription: string | null;
            }> = [];

            let subTotal = 0;
            let totalDiscounts = 0;

            // Calcular descuentos por variante
            for (const item of items) {
                const variant = variants.find(v => v.id === item.variantId)!;
                const product = variant.product;
                
                const originalPrice = variant.price;
                const finalPrice = originalPrice; // Mantener precio original, descuento se resta al final
                let discountAmount = 0;
                let discountPercentage = 0;
                let discountType: string | null = null;
                let discountDescription: string | null = null;

                // Calcular descuento de la variante (si existe)
                if (variant.discountPercent && variant.discountPercent > 0) {
                    discountPercentage = variant.discountPercent;
                    discountAmount = (originalPrice * discountPercentage) / 100;
                    discountType = 'variant';
                    discountDescription = `Descuento en producto: ${discountPercentage}%`;
                }

                const itemSubtotal = originalPrice * item.quantity; // Subtotal sin descuento
                const itemTotalDiscount = discountAmount * item.quantity;
                
                subTotal += itemSubtotal;
                totalDiscounts += itemTotalDiscount;

                orderItems.push({
                    variantId: item.variantId,
                    productId: product.id,
                    quantity: item.quantity,
                    originalPrice,
                    finalPrice,
                    discountAmount,
                    discountPercentage,
                    discountType,
                    discountDescription
                });
            }

            // Obtener método de pago para calcular su descuento
            const paymentMethod = await tx.paymentMethod.findUnique({
                where: { id: paymentMethodId }
            });

            if (!paymentMethod) {
                throw new Error('Método de pago no encontrado');
            }

            // Aplicar descuento del método de pago (si existe)
            let paymentDiscountAmount = 0;
            if (paymentMethod.discountPercent && paymentMethod.discountPercent > 0) {
                paymentDiscountAmount = subTotal * (paymentMethod.discountPercent / 100);
                totalDiscounts += paymentDiscountAmount;
            }

            // TODO: Futura implementación de descuentos por cupón
            // const couponDiscount = await calculateCouponDiscount(couponCode, subTotal);
            // totalDiscounts += couponDiscount.amount;

            // 2.5 Calcular costo de envío
            const { calculateShippingCost } = await import('@/actions/shipping/calculate-shipping');
            const shippingCalculation = await calculateShippingCost(address, subTotal, totalDiscounts);

            const shippingCost = Number(shippingCalculation?.cost ?? 0);
            const shippingMethod = shippingCalculation?.method ?? 'standard';
            const freeShipping = Boolean(shippingCalculation?.isFree);

            if (!Number.isFinite(shippingCost)) {
                throw new Error('No se pudo calcular el costo de envío');
            }

            // 2.6 Calcular total (sin impuestos porque ya están incluidos en el precio)
            const tax = 0; // Los precios ya incluyen impuestos
            const total = subTotal - totalDiscounts + shippingCost + tax;

            if (!Number.isFinite(total)) {
                throw new Error('No se pudo calcular el total del checkout');
            }

            // 2.6 Usar el método de pago ya obtenido anteriormente
            // (el paymentMethod ya fue obtenido para calcular descuentos)

            // 2.7 Obtener empresa por defecto
            let company = await tx.company.findFirst({
                where: { isDefault: true }
            });

            if (!company) {
                company = await tx.company.create({
                    data: {
                        name: 'Mi Tienda Online',
                        slug: 'mi-tienda-online',
                        isDefault: true,
                        isActive: true
                    }
                });
            }

            // 2.8 Crear OrderSession temporal (NO Order todavía)
            const reservationExpiresAt = new Date();
            reservationExpiresAt.setMinutes(reservationExpiresAt.getMinutes() + 15);

            const sessionToken = generateSessionToken();

            const orderSession = await tx.orderSession.create({
                data: {
                    sessionToken,
                    user: {
                        connect: { id: userId }
                    },
                    company: {
                        connect: { id: company.id }
                    },
                    paymentMethod: {
                        connect: { id: paymentMethod.id }
                    },
                    subTotal,
                    tax,
                    total,
                    discounts: totalDiscounts,
                    deliveryMethod: address.deliveryMethod || 'delivery',
                    shippingCost,
                    shippingMethod,
                    freeShipping,
                    address: JSON.stringify({
                        firstName: address.firstName,
                        lastName: address.lastName,
                        address: address.address,
                        address2: address.address2,
                        postalCode: address.postalCode,
                        city: address.city,
                        phone: address.phone,
                        countryId: address.country
                    }),
                    cartItems: JSON.stringify(orderItems.map(item => ({
                        variantId: item.variantId,
                        productId: item.productId,
                        quantity: item.quantity,
                        originalPrice: item.originalPrice,
                        discountAmount: item.discountAmount,
                        discountPercentage: item.discountPercentage,
                        discountType: item.discountType,
                        discountDescription: item.discountDescription
                    }))),
                    expiresAt: reservationExpiresAt,
                    isProcessed: false
                }
            });

            console.log('✅ OrderSession creada con token:', sessionToken);

            // 2.9 Crear reservas de stock temporal asociadas a la OrderSession
            const stockReservationBaseId = `session-${sessionToken}`;
            for (const item of items) {
                await tx.stockReservation.create({
                    data: {
                        reservationId: `${stockReservationBaseId}-${item.variantId}`,
                        variantId: item.variantId,
                        quantity: item.quantity,
                        userId,
                        status: 'ACTIVE',
                        reason: 'checkout_session',
                        orderKey: sessionToken, // Usar sessionToken en lugar de orderId
                        expiresAt: reservationExpiresAt
                    }
                });
            }

            console.log('📦 Stock reservado temporalmente hasta:', reservationExpiresAt);

            return {
                sessionToken: orderSession.sessionToken,
                total,
                reservationExpiresAt,
                orderItems: orderItems.map(item => ({
                    title: variants.find(v => v.id === item.variantId)!.product.title,
                    quantity: item.quantity,
                    price: item.finalPrice
                }))
            };
        });

        // 3. Crear preferencia de MercadoPago
        console.log('💳 Creando preferencia de MercadoPago...');
        
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const description = result.orderItems
            .map(item => `${item.title} x${item.quantity}`)
            .join(', ');

        const preference = {
            items: [{
                title: description.substring(0, 256),
                unit_price: result.total,
                quantity: 1,
                id: result.sessionToken
            }],
            external_reference: result.sessionToken,
            back_urls: {
                success: `${baseUrl}/orders/payment-success`,
                failure: `${baseUrl}/orders/payment-failure`,
                pending: `${baseUrl}/orders/payment-pending`
            },
            payment_methods: {
                excluded_payment_types: [
                    { id: 'ticket' },
                    { id: 'atm' }
                ]
            },
            auto_return: "approved",
            expires: true,
            expiration_date_from: new Date().toISOString(),
            expiration_date_to: result.reservationExpiresAt.toISOString(),
            notification_url: `${baseUrl}/api/webhooks/mercadopago`
        };

        const mpResponse = await new Preference(mercadopago).create({
            body: preference
        });

        if (!mpResponse?.init_point) {
            throw new Error('Error creando preferencia de MercadoPago');
        }

        // 4. Guardar ID de preferencia en la OrderSession
        await prisma.orderSession.update({
            where: { sessionToken: result.sessionToken },
            data: { 
                // Podrías agregar un campo mpPreferenceId si lo necesitas
                updatedAt: new Date()
            }
        });

        console.log('🎯 Preferencia MP creada:', mpResponse.id);
        console.log('🔗 URL de pago:', mpResponse.init_point);
        console.log('🔗 SessionToken:', result.sessionToken);

        return {
            ok: true,
            sessionToken: result.sessionToken,
            mpRedirectUrl: mpResponse.init_point,
            reservationExpiresAt: result.reservationExpiresAt
        };

    } catch (error: any) {
        console.error('❌ Error en checkout seguro:', error);

        const rawMessage = error instanceof Error ? error.message : '';
        const isInternalError =
            rawMessage.includes('Invalid `prisma.') ||
            rawMessage.includes('PrismaClient') ||
            rawMessage.includes('Argument `');

        return {
            ok: false,
            error: isInternalError
                ? 'No pudimos iniciar el pago en este momento. Intentá nuevamente.'
                : rawMessage || 'Error interno al procesar el checkout'
        };
    }
};