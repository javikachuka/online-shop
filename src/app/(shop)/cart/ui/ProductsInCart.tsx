"use client";

import { useEffect, useState } from "react";
import { ProductImage, QuantitySelector } from "@/components";
import { useCartStore } from "@/store";
import Image from "next/image";
import Link from "next/link";
import { getNameAttributes } from "@/utils";
import { currencyFormat } from '../../../../utils/currencyFormat';
import { CartProduct } from "@/interfaces";
import { useRouter } from "next/navigation";
import { Toaster, toast } from 'sonner'

export const ProductsInCart = () => {
    const router = useRouter()
    const updateProductQuantity = useCartStore(
        (state) => state.updateProductQuantity
    );
    const removeProduct = useCartStore((state) => state.removeProduct);
    const [loaded, setLoaded] = useState(false);
    const productsInCart = useCartStore((state) => state.getCart());
    
    type VariantStock = { id: string | number; stock: number }[];
    const [variantStock, setVariantStock] = useState<VariantStock>([]);
    const totalItemsInCart = useCartStore(state => state.getTotalItems())
    console.log(productsInCart);

    if(totalItemsInCart === 0){
        router.push('/empty')
    }

    
    

    useEffect(() => {
        setLoaded(true);
        const fetchStock = async () => {
            const variantIds = productsInCart.map(p => p.variantId);
            // Llama a tu action o endpoint
            const res = await fetch('/api/stock-by-variant', {
                method: 'POST',
                body: JSON.stringify({ variantIds }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();

            console.log({data});
            
            
            setVariantStock(data); // { [variantId]: stock }
            // Maneja la respuesta y actualiza el estado según sea necesario
            data.forEach((variant: { id: string | number; stock: number, discountPercent: number|null  }) => {
                useCartStore.getState().updateVariantPriceDiscount(variant.id.toString(), variant.discountPercent)
            })


        };
        console.log(productsInCart);
        if (productsInCart.length > 0) {
            fetchStock();
        }
    }, [productsInCart]);

    const handleQuantityChange = async (product : CartProduct, value: number) => {
        
        const variant = variantStock.find(v => v.id === product.variantId);

        if (variant && value > variant.stock) {
            toast.error(`No hay suficiente stock para ${product.title} con esta combinación.`);
            return;
        }else {
            updateProductQuantity(product, value)
        }
    }

    if (!loaded) {
        return <p>Cargando...</p>;
    }

    
    return (
        <>
            {productsInCart.map((product) => (
                <div
                    key={`${product.variantId}`}
                    className="flex mb-2 sm:mb-5"
                >
                    <ProductImage
                        src={product.image}
                        height={50}
                        width={100}
                        alt={product.title}
                        className="mr-5 rounded self-start"
                    />
                    <div>
                        <Link
                            className="hover:underline cursor-pointer"
                            href={`/product/${product.slug}`}
                        >
                            {product.title} - {getNameAttributes(product.attributes)}
                        </Link>
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
                        <QuantitySelector
                            quantity={product.quantity}
                            onQuantityChanged={(value) =>
                                handleQuantityChange(product,value)
                            }
                        />
                        <button
                            onClick={() => removeProduct(product)}
                            className="underline mt-3"
                            >
                            Remover
                        </button>
                    </div>
                </div>
            ))}
            <Toaster
                position="bottom-right"
            />
        </>
    );
};
