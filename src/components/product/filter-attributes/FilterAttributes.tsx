"use client";

import { useEffect, useState } from "react";
import { CartProduct, Product, ProductVariant } from "@/interfaces";
import { QuantitySelector } from "@/components";
import { useCartStore } from "@/store";
import { currencyFormat } from "@/utils";
import { Toaster, toast } from 'sonner'

interface Props {
    product: Product;
    filters: { [attrName: string]: string[] };
}


export const FilterAttributes = ({ product, filters }: Props) => {
    const variants = product.variants || [];
    
    // Selecciona la primera opción de cada filtro al montar el componente, solo si la variante resultante tiene stock > 0
    const getDefaultSelectedAttributes = () => {
        // Genera todas las combinaciones posibles de atributos
        const attributeNames = Object.keys(filters);
        const attributeValues = attributeNames.map(attr => filters[attr]);
        // Función recursiva para obtener todas las combinaciones
        function getCombinations(arrays: string[][], prefix: string[] = []): string[][] {
            if (!arrays.length) return [prefix];
            const [first, ...rest] = arrays;
            return first.flatMap(value => getCombinations(rest, [...prefix, value]));
        }
        const allCombinations = getCombinations(attributeValues);
        // Busca la primera combinación con stock > 0
        for (const combination of allCombinations) {
            const selection = Object.fromEntries(attributeNames.map((name, i) => [name, combination[i]]));
            const matchedVariant = variants.find(variant =>
                Object.entries(selection).every(([a, v]) =>
                    variant.attributes.some(attr => attr.attribute.name === a && attr.value.value === v)
                )
            );
            if (matchedVariant && matchedVariant.stock > 0) {
                return selection;
            }
        }
        // Si ninguna combinación tiene stock, retorna vacío
        return {};
    };
    const [selectedAttributes, setSelectedAttributes] = useState<{ [attrName: string]: string }>(getDefaultSelectedAttributes());
    const [quantity, setQuantity] = useState<number>(1);
    const [errorSelection, setErrorSelection] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);
    const addProductToCart = useCartStore((state) => state.addProductToCart);
    const isInCart = useCartStore((state) => state.isInCart);
    const [priceToShow, setPriceToShow] = useState<number|null>(
        product.variants && product.variants[0] ? product.variants[0].price : 0
    );
    const [selectedVariantData, setSelectedVariantData] = useState<ProductVariant | null>(null);

    useEffect(() => {
        // Solo buscar variante si se seleccionaron todos los atributos requeridos
        const allFiltersSelected =
            Object.keys(selectedAttributes).length === Object.keys(filters).length;

        let matchedVariant = null;
        if (allFiltersSelected) {
            matchedVariant = variants.find((variant) =>
                Object.entries(filters).every(([attrName]) =>
                    variant.attributes.some(
                        (attr) =>
                            attr.attribute.name === attrName &&
                            selectedAttributes[attrName] === attr.value.value
                    )
                )
            );
        }


        if (matchedVariant) {
            setPriceToShow(matchedVariant.price);
            setSelectedVariantData(matchedVariant);
        } else {
            setPriceToShow(null);
            setSelectedVariantData(null);
        }
        
        setQuantity(1);
    }, [selectedAttributes]);

    //manejar el cambio de cantidad segun stock
    const handleQuantityChange = async (value: number) => {
        
        if(selectedVariantData === null) {
            toast.error("Debe seleccionar una combinación válida antes de cambiar la cantidad.");
            return;
        }
        const variantInCart = isInCart(selectedVariantData.id);
        if(variantInCart && value + variantInCart.quantity > selectedVariantData.stock){
            toast.error(`No hay suficiente stock para ${product.title} con esta combinación.`);
            return;
        }
        // Llama a tu action o endpoint
        const res = await fetch('/api/stock-by-variant', {
            method: 'POST',
            body: JSON.stringify({ variantIds: [selectedVariantData?.id] }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json(); 
        const variant = data.find((v: { id: string | number; stock: number }) => v.id === selectedVariantData?.id);
        if (!variant) {
            toast.error(`No se encontró la variante para ${product.title}.`);
            return;
        }
        if ( value > variant.stock) {
            toast.error(`No hay suficiente stock para ${product.title} con esta combinación.`);
            return;
        }else {
            setQuantity(value);
        }
    }

    // Filtra variantes según la selección actual
    const filteredVariants = variants.filter((variant) =>
        Object.entries(selectedAttributes).every(([attrName, value]) =>
            variant.attributes.some(
                (attr) =>
                    attr.attribute.name === attrName && attr.value.value === value
            )
        )
    );
    const selectedVariant =
        filteredVariants.length === 1 ? filteredVariants[0] : null;

    // Determina si una combinación es posible para un valor de atributo dado la selección actual y stock > 0
    const isOptionAvailable = (attrName: string, value: string) => {
        // Simula la selección si se eligiera este valor
        const simulatedSelection = { ...selectedAttributes, [attrName]: value };
        // Busca la variante que cumpla con la selección y tenga stock > 0
        const possible = variants.some((variant) => {
            const matches = Object.entries(simulatedSelection).every(([a, v]) =>
                variant.attributes.some(
                    (attr) => attr.attribute.name === a && attr.value.value === v
                )
            );
            return matches && variant.stock > 0;
        });
        return possible;
    };

    const handleClickFilter = (attrName: string, value: string) => {
        setSelectedAttributes((prev) => {
            // Si el valor ya está seleccionado, desmarcarlo (eliminarlo del estado)
            if (prev[attrName] === value) {
                const { [attrName]: _, ...rest } = prev;
                return rest;
            }
            let newSelected = { ...prev, [attrName]: value };

            return newSelected;
        });
    };

    const addToCart = async () => { // ← Hacer async
        if (Object.entries(selectedAttributes).length === 0) {
            setErrorSelection(true);
            return;
        } 
        if (Object.entries(filteredVariants).length === 0){
            setErrorSelection(true);
            return;
        } 
        if (
            Object.entries(selectedAttributes).length <
            Object.entries(filters).length
        ) {
            setErrorSelection(true);
            return;
        }
        setAddedToCart(true);
        
        // Buscar la variante que coincida con la selección
        const matchedVariant = findMatchedVariant();
        if (!matchedVariant) return;

        // 🔧 VALIDAR STOCK REAL (considerando reservas)
        try {
            const res = await fetch('/api/stock-by-variant', {
                method: 'POST',
                body: JSON.stringify({ variantIds: [matchedVariant.id] }),
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!res.ok) {
                throw new Error('Error al verificar stock');
            }
            
            const stockData = await res.json();
            const variantStock = stockData.find((v: { id: string; stock: number }) => v.id === matchedVariant.id);
            
            if (!variantStock) {
                toast.error('Error al verificar disponibilidad del producto');
                setAddedToCart(false);
                setErrorSelection(false);
                return;
            }

            // Verificar stock disponible vs cantidad en carrito + nueva cantidad
            const variantInCart = isInCart(matchedVariant.id);
            const quantityInCart = variantInCart ? variantInCart.quantity : 0;
            const totalQuantity = quantityInCart + quantity;
            
            if (totalQuantity > variantStock.stock) {
                toast.error(`Stock insuficiente.`);
                setAddedToCart(false);
                setErrorSelection(false);
                return;
            }

            // ✅ Stock OK - Proceder a agregar al carrito
            const cartProduct: CartProduct = {
                variantId: matchedVariant.id,
                price: matchedVariant.price,
                title: product.title,
                slug: product.slug,
                quantity: quantity,
                image: product.ProductImage?.[0]?.url || "",
                attributes: matchedVariant.attributes,
                discountPercent: matchedVariant.discountPercent || 0
            };

            addProductToCart(cartProduct);
            setErrorSelection(false);
            setQuantity(1);
            setTimeout(() => {
                toast.success("Producto agregado al carrito")
                setAddedToCart(false);
            }, 500);

        } catch (error) {
            toast.error('Error al verificar stock disponible');
            setAddedToCart(false);
            setErrorSelection(false);
        }
    };

    const findMatchedVariant = () => {
        if (Object.keys(selectedAttributes).length === 0) return null;
        return variants.find((variant) =>
            Object.entries(selectedAttributes).every(([a, v]) =>
                variant.attributes.some(
                    (attr) => attr.attribute.name === a && attr.value.value === v
                )
            ))
    };

    return (
        <>
            {/* Mostrar precio tachado y precio con descuento si corresponde */}
            {selectedVariant && typeof selectedVariant.discountPercent === 'number' && selectedVariant.discountPercent > 0 ? (
                <div className="flex items-center gap-3 mb-2 md:mb-5">
                    <span className="line-through text-gray-400 text-lg">
                        {currencyFormat(selectedVariant.price)}
                    </span>
                    <span className="text-lg font-bold text-red-600">
                        {currencyFormat(selectedVariant.price * (1 - (selectedVariant.discountPercent ?? 0) / 100))}
                    </span>
                </div>
            ) : (
                priceToShow && (
                    <p className="text-lg mb-2 md:mb-5">{currencyFormat(priceToShow || 0)}</p>
                )
            )}
            {
                !priceToShow && (
                    <p className="text-sm mb-2 md:mb-5 min-h-7">⚠️ Seleccioná una combinación para ver el precio.</p>
                )
            }
            <div>
                {errorSelection && (
                    <span className="mt-2 text-red-500 fade-in">
                        Debe seleccionar una combinación*
                    </span>
                )}
                {Object.entries(filters).map(([attrName, values]) => (
                    <div key={attrName} className="mb-2">
                        <span className="font-bold mr-2">{attrName}:</span>
                        <div className="flex gap-2 my-2 flex-wrap">
                            {Array.isArray(values)
                                ? values.map((value: string) => {
                                      const isSelected =
                                          selectedAttributes[attrName] ===
                                          value;
                                      const available = isOptionAvailable(
                                          attrName,
                                          value
                                      );
                                      return (
                                          <button
                                              key={value}
                                              onClick={() =>
                                                  available &&
                                                  handleClickFilter(
                                                      attrName,
                                                      value
                                                  )
                                              }
                                              className={`btn ${
                                                  isSelected
                                                      ? "btn-primary"
                                                      : "btn-outline"
                                              } ${
                                                  !available ? "btn-dashed" : ""
                                              }`}
                                              type="button"
                                              disabled={!available}
                                          >
                                              {value}
                                          </button>
                                      );
                                  })
                                : null}
                        </div>
                    </div>
                ))}
                {/* Solo mostrar mensaje si NO hay variantes posibles */}
                {Object.keys(selectedAttributes).length > 0 &&
                    filteredVariants.length === 0 && (
                        <div className="mt-4 text-red-500">
                            No hay variante disponible con esta combinación.
                        </div>
                    )}
                {/* selector cantidad */}
                <QuantitySelector
                    quantity={quantity}
                    onQuantityChanged={(value) => {
                            handleQuantityChange(value)
                        }
                    }
                    maxQuantity={selectedVariant?.stock || undefined}
                />
                
                <button disabled={addedToCart} className={`${addedToCart ? 'btn-disabled' : 'btn-primary'} mb-5`} onClick={addToCart}>
                    {addedToCart ? "Agregando" : "Agregar al carrito"}
                </button>
                {
                    product.diffPrice && (
                        <p className="text-xs mb-5">
                            **El precio puede variar según la combinación seleccionada.
                        </p>
                    )
                }
                <Toaster
                    position="bottom-right"
                />
            </div>
        </>
    );
};
