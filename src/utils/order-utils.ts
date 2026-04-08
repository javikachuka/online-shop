// Genera un string con los títulos de los productos de la orden y su cantidad, separados por un salto de línea
export function getOrderProductTitles(orderItems: any[]): string {
    return orderItems.map(item => `${item.product.title} x${item.quantity}`).join('\n');
}

type OrderProductImage = {
    id: string;
    url: string;
    variants?: {
        id: string;
        attributes?: {
            attributeId: string;
            value?: { value: string } | null;
        }[] | null;
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
    if (!images || images.length === 0) return "";

    // No grouping → always first image
    if (!imageGroupingAttributeId) {
        return images[0]?.url || "";
    }

    // 1. Image directly linked to this variant by id
    const byVariantId = images.find(image =>
        image.variants?.some(v => v.id === variant.id)
    );
    if (byVariantId?.url) return byVariantId.url;

    // 2. Image matched by shared visual attribute value
    const visualValue = variant.attributes.find(
        attr => attr.attributeId === imageGroupingAttributeId
    )?.value?.value;

    if (visualValue) {
        const byVisualAttribute = images.find(image =>
            image.variants?.some(v =>
                v.attributes?.some(
                    attr =>
                        attr.attributeId === imageGroupingAttributeId &&
                        attr.value?.value === visualValue
                )
            )
        );
        if (byVisualAttribute?.url) return byVisualAttribute.url;
    }

    // 3. General image (not linked to any variant)
    const generalImage = images.find(
        image => !image.variants || image.variants.length === 0
    );
    return generalImage?.url || images[0]?.url || "";
}