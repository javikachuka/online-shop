"use client";

import { useEffect, useState, useRef } from "react";
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
    
    type VariantStock = { id: string | number; stock: number; discountPercent: number | null }[];
    const [variantStock, setVariantStock] = useState<VariantStock>([]);
    const totalItemsInCart = useCartStore(state => state.getTotalItems())
    
    // Usar useRef para trackear qué variantes ya han sido actualizadas
    const updatedVariants = useRef(new Set<string>());

    if(totalItemsInCart === 0){
        router.push('/empty')
    }

    useEffect(() => {
        setLoaded(true);
    }, []);

    // Separar el fetch de stock en su propio useEffect
    useEffect(() => {
        const fetchStock = async () => {
            if (productsInCart.length === 0) return;
            
            const variantIds = productsInCart.map(p => p.variantId);
            
            try {
                const res = await fetch('/api/stock-by-variant', {
                    method: 'POST',
                    body: JSON.stringify({ variantIds }),
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();

                setVariantStock(data);
                
            } catch (error) {
                console.error('Error fetching stock:', error);
            }
        };

        // Solo hacer fetch si hay productos y no hemos cargado el stock aún
        if (loaded && productsInCart.length > 0 && variantStock.length === 0) {
            fetchStock();
        }
    }, [loaded, productsInCart.length, variantStock.length]); // Agregamos variantStock.length como dependencia

    // Separar la actualización de precios y descuentos
    useEffect(() => {
        if (variantStock.length > 0) {
            variantStock.forEach((variant: { id: string | number; stock: number, discountPercent: number|null }) => {
                const variantId = variant.id.toString();
                
                // Solo actualizar si no lo hemos hecho antes
                if (!updatedVariants.current.has(variantId)) {
                    useCartStore.getState().updateVariantPriceDiscount(variantId, variant.discountPercent);
                    updatedVariants.current.add(variantId);
                }
            });
        }
    }, [variantStock]); // Solo depende de variantStock

    // Limpiar el set cuando el carrito cambie completamente
    useEffect(() => {
        if (productsInCart.length === 0) {
            updatedVariants.current.clear();
        }
    }, [productsInCart.length]);

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
