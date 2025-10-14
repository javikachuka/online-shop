import { ProductVariantAttribute } from "@/interfaces";

export const getNameAttributes = (attributes: ProductVariantAttribute[] = []) => {
    return attributes
        .map((attr) => `${attr.attribute.name}: ${attr.value.value}`)
        .join(", ");
};