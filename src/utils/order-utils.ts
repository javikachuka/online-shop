import { getProductImageForVariantUrl } from "./product-image-utils";

// Genera un string con los títulos de los productos de la orden y su cantidad, separados por un salto de línea
export function getOrderProductTitles(orderItems: any[]): string {
    return orderItems.map(item => `${item.product.title} x${item.quantity}`).join('\n');
}

type OrderProductImage = {
    id: string;
    url: string;
    sortOrder?: number;
    variantAssignments?: {
        id: string;
        sortOrder: number;
        variant: {
            id: string;
            attributes?: {
                attributeId: string;
                value?: { value: string } | null;
            }[] | null;
        };
    }[] | null;
};

type OrderItemVariant = {
    id: string;
    attributes: {
        attributeId: string;
        value?: { value: string } | null;
    }[];
};

/**
 * Returns the most appropriate image URL for an order item,
 * matching the purchased variant using the same priority as getCartImageForVariant.
 */
export function getOrderItemImage(
    images: OrderProductImage[],
    variant: OrderItemVariant,
    imageGroupingAttributeId?: string | null
): string {
    return getProductImageForVariantUrl(images, variant, imageGroupingAttributeId);
}