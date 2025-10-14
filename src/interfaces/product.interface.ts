export interface ProductImage {
    id: string;
    url: string;
}

export interface AttributeValue {
    id: string;
    value: string;
    attributeId: string;
}

export interface Attribute {
    id: string;
    name: string;
}

export interface AttributeWithValues extends Attribute {
    values: AttributeValue[];
}

export interface ProductVariantAttribute {
    id: string;
    attribute: Attribute;
    attributeId: string;
    value: AttributeValue;
    valueId: string;
}

export interface ProductVariant {
    id: string;
    price: number;
    stock: number;
    sku?: string|null;
    discountPercent?: number; 
    attributes: ProductVariantAttribute[];
    order: number;
}

export interface Product {
    id: string;
    title: string;
    description: string;
    slug: string;
    tags: string[];
    diffPrice: boolean;
    ProductImage?: ProductImage[];
    variants?: ProductVariant[];
    categories?: CategorySimple[];
    isEnabled: boolean;
    // Puedes agregar categories si lo necesitas
}

interface CategorySimple {
    categoryId: string;
}

export interface CartProduct {
    variantId: string;
    title: string;
    slug: string;
    price: number;
    quantity: number;
    image: string;
    attributes: ProductVariantAttribute[];
    discountPercent?: number|null;
}