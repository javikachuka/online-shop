import { prisma } from '@/lib/prisma';
import { getNameAttributes } from '@/utils/getNameAttributes';
import { GaItem, OrderAnalyticsSummary } from '@/types/analytics';

/**
 * Arma el DTO de analytics de una orden ya confirmada en BD, sin exponer datos sensibles,
 * para que el cliente pueda disparar el evento GA4 `purchase` de forma confiable
 * (tanto para pagos con Mercado Pago como para pagos offline).
 */
export async function buildOrderAnalyticsSummary(orderId: string): Promise<OrderAnalyticsSummary | undefined> {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            OrderItem: {
                include: {
                    product: { select: { title: true } },
                    variant: {
                        include: {
                            attributes: {
                                include: { attribute: true, value: true }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!order) return undefined;

    const items: GaItem[] = order.OrderItem.map((item) => {
        const variantLabel = getNameAttributes(item.variant.attributes);
        return {
            item_id: item.variantId,
            item_name: item.product.title,
            item_variant: variantLabel || undefined,
            price: item.price,
            quantity: item.quantity,
        };
    });

    return {
        orderId: order.id,
        value: order.total,
        shipping: order.shippingCost || undefined,
        tax: order.tax || undefined,
        items,
    };
}
