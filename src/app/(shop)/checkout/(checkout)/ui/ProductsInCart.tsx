"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/store";
import Image from "next/image";
import { currencyFormat, getNameAttributes } from "@/utils";
import { redirect } from "next/navigation";
import { ProductImage } from "@/components";

export const ProductsInCart = () => {
    
    const [loaded, setLoaded] = useState(false);
    const productsInCart = useCartStore((state) => state.getCart());

    useEffect(() => {
        setLoaded(true);
    }, []);
    if (!loaded) {
        return <p>Cargando...</p>;
    }
    return (
        <>
            {productsInCart.map((product) => (
                <div
                    key={`${product.variantId}`}
                    className="flex mb-5"
                >
                    <ProductImage
                        src={product.image}
                        height={100}
                        width={100}
                        alt={product.title}
                        className="mr-5 rounded self-start"
                    />
                    <div>
                        <span
                            className=""
                        >
                            {product.title} - {getNameAttributes(product.attributes)} ({product.quantity})
                        </span>
                        {
                            product.discountPercent && product.discountPercent > 0 ? (
                                <div className="flex items-center space-x-2">
                                    <span className="text-red-600 font-bold">
                                        {currencyFormat(product.price * (1 - product.discountPercent / 100))}
                                    </span>
                                    <span className="line-through text-gray-500">
                                        {currencyFormat(product.price)}
                                    </span>
                                    <span className="bg-red-100 text-red-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                                        -{product.discountPercent}%
                                    </span>
                                </div>
                            ) : (
                                <p className="font-bold">{currencyFormat(product.price)}</p>
                            )
                        }                    
                    </div>
                </div>
            ))}
        </>
    );
};
