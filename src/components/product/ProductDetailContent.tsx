"use client";

import { useState } from "react";
import { FilterAttributes, ShareProduct, SlideShowSwitcher } from "@/components";
import { titleFont } from "@/config/fonts";
import { Product, ProductVariant } from "@/interfaces";

interface Props {
    product: Product;
    filters: { [attributeName: string]: string[] };
}

export const ProductDetailContent = ({ product, filters }: Props) => {
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

    return (
        <div className="md:mt-5 mb-20 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-7xl mx-auto">
            <div className="col-span-1 md:col-span-2 ">
                <SlideShowSwitcher
                    title={product.title}
                    images={product.ProductImage || []}
                    variants={product.variants || []}
                    imageGroupingAttributeId={product.imageGroupingAttributeId}
                    selectedVariantId={selectedVariant?.id ?? null}
                />
            </div>

            <div className="col-span-1 px-5 ">
                <h1 className={`${titleFont.className} antialiased font-bold text-xl`}>
                    {product.title}
                </h1>

                <FilterAttributes
                    product={product}
                    filters={filters}
                    onVariantChange={(variant: ProductVariant | null) => setSelectedVariant(variant)}
                />

                <ShareProduct productTitle={product.title} variantAttributes={selectedVariant?.attributes} />

                <h2 className="font-bold text-sm mt-4">Descripción</h2>
                <p className="font-light text-gray-700">{product.description}</p>
            </div>

        </div>
    );
};
