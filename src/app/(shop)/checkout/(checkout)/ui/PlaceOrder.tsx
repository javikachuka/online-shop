"use client";

import Link from "next/link";
import { placeOrder } from "@/actions";
import { PaymentButtons, ShippingInfo } from "@/components";
import { PaymentMethod } from "@/interfaces";
import { useAddressStore, useCartStore } from "@/store";
import { useOrderSummary } from "@/hooks";
import { currencyFormat } from "@/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Props{
    paymentsMethods: PaymentMethod[]
}

export const PlaceOrder = ({paymentsMethods} : Props) => {
    const router = useRouter();
    const [loaded, setLoaded] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(paymentsMethods.length > 0 ? paymentsMethods[0] : null);
    const hasAvailablePaymentMethods = paymentsMethods.length > 0;

    const address = useAddressStore((state) => state.getAddress());
    const cart = useCartStore((state) => state.cart);
    const clearCart = useCartStore((state) => state.clearCart);

    const { 
        itemsInCart, 
        subTotal, 
        tax, 
        total, 
        discount, 
        shippingCost, 
        freeShipping, 
        freeShippingThreshold,
        totalWithShipping,
        progressToFreeShipping 
    } = useOrderSummary(address.deliveryMethod || 'delivery');

    useEffect(() => {
        setLoaded(true);
    }, []);

    useEffect(() => {
        if (!selectedPayment && paymentsMethods.length > 0) {
            setSelectedPayment(paymentsMethods[0]);
        }
    }, [paymentsMethods, selectedPayment]);

    const onPlaceOrder = async () => {
        if (!selectedPayment) {
            setErrorMessage("No pudimos cargar las opciones de pago en este momento. Intentá nuevamente.");
            return;
        }

        setErrorMessage("");
        setIsPlacingOrder(true)

        const productsToOrder = cart.map(variant => ({
            variantId: variant.variantId,
            quantity: variant.quantity,

        }))
        
        

        const response = await placeOrder(productsToOrder, address, selectedPayment);

        if(!response.ok){
            setIsPlacingOrder(false)
            setErrorMessage(response.message || "Error al realizar el pedido");
            return;
        }

        clearCart();
        router.replace(`/orders/${response.order?.id}`);

    }

    if (!loaded) {
        return <p>Cargando...</p>;
    }

    return (
        <div className="bg-white rounded-xl shadow-xl p-7">
            <div className="mb-4">
                <h2 className="text-2xl mb-2">Resumen de pedido</h2>
                <div className="grid grid-cols-2">
                    <span>No. Productos</span>
                    <span className="text-right">
                        {itemsInCart === 1 ? "1 articulo" : `${itemsInCart} articulos`}
                    </span>
                    <span>Subtotal</span>
                    <span className="text-right">{currencyFormat(subTotal)}</span>
                    {/* TODO - here show taxes */}
                    {
                        discount > 0 && (
                            <>
                                <span>Descuentos</span>
                                <span className="text-right">- {currencyFormat(discount)}</span>
                            </>
                        )
                    }
                    
                    {/* Descuento por método de pago */}
                    {
                        selectedPayment?.discountPercent && selectedPayment.discountPercent > 0 && (
                            <>
                                <span className="text-green-600">Descuento {selectedPayment.name}</span>
                                <span className="text-right text-green-600">
                                    - {currencyFormat((subTotal - discount) * (selectedPayment.discountPercent / 100))}
                                </span>
                            </>
                        )
                    }
                    
                    {/* Información de envío */}
                    <ShippingInfo 
                        shippingCost={shippingCost}
                        freeShipping={freeShipping}
                        method="standard"
                        deliveryMethod={address.deliveryMethod}
                    />
                    
                    <span className="text-lg mt-5">Total:</span>
                    <span className="text-lg mt-5 text-right">
                        {(() => {
                            const discountPercent = selectedPayment?.discountPercent ?? 0;
                            
                            if (discountPercent > 0) {
                                // Descuento SOLO sobre productos (sin envío)
                                const baseForDiscount = subTotal - discount;
                                const paymentDiscount = baseForDiscount * (discountPercent / 100);
                                const finalTotal = totalWithShipping - paymentDiscount;
                                
                                return (
                                    <span className="text-green-600 font-bold">
                                        {currencyFormat(finalTotal)}
                                    </span>
                                );
                            }
                            return (
                                <span className="font-bold">
                                    {currencyFormat(totalWithShipping)}
                                </span>
                            );
                        })()}
                    </span>
                </div>
            </div>
            
            {/* Progreso hacia envío gratis */}
            {/* {!freeShipping && progressToFreeShipping > 0 && (
                <div className="mb-4">
                    <ShippingBadge 
                        freeShipping={freeShipping}
                        progressToFreeShipping={progressToFreeShipping}
                        freeShippingThreshold={freeShippingThreshold}
                    />
                </div>
            )} */}
            
            <div className="w-full h-0.5 rounded bg-gray-200 mb-4"></div>
            <div className="mb-4">
                <h2 className="text-2xl mb-2">Forma de pago</h2>
                <div className="flex flex-col">
                    {!hasAvailablePaymentMethods ? (
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            <p className="font-semibold">No pudimos cargar las opciones de pago.</p>
                            <p className="mt-1">Intentá nuevamente en unos minutos o volvé al carrito para revisar tu compra.</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => router.refresh()}
                                >
                                    Reintentar
                                </button>
                                <Link href="/cart" className="btn-primary">
                                    Volver al carrito
                                </Link>
                            </div>
                        </div>
                    ) : (
                        paymentsMethods.map(pm => (
                            <div className="flex items-center" key={pm.id}>
                                <label className="flex cursor-pointer items-center gap-2 py-2 px-1">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        className="peer sr-only"
                                        checked={selectedPayment?.id === pm.id}
                                        onChange={() => setSelectedPayment(pm)}
                                    />
                                    <span className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-gray-300 bg-white peer-checked:border-blue-500 peer-checked:bg-blue-500 peer-checked:shadow-[inset_0_0_0_3px_white] transition-all duration-150" />
                                    <span className="text-sm select-none">{pm.name}</span>
                                </label>
                            </div>
                        ))
                    )}
                </div>
                {selectedPayment?.description && (
                    <div className={`mt-2 ${selectedPayment.discountPercent ? 'text-green-600' : ''} text-sm font-semibold`}>
                        {selectedPayment.description}
                    </div>
                )}
            </div>
            <div className="w-full h-0.5 rounded bg-gray-200 mb-4"></div>
            <div className="mb-4">
                <h2 className="text-2xl mb-2">Dirección de entrega</h2>
                <div>
                    <p className="text-xl">{address.firstName} {address.lastName}</p>
                    <p>{address.address}</p>
                    <p>{address.address2}</p>
                    <p>{address.postalCode}</p>
                    <p>{address.city}, {address.country}</p>
                    <p>{address.phone}</p>
                </div>
            </div>
            <div className="mt-5 mb-2 w-full">
                <p className="mb-5">
                    <span className="text-xs">
                        Al hacer clic en &quot;Realizar pedido&quot; aceptas
                        nuestros{" "}
                        <a href="#" className="underline">
                            terminos y condiciones
                        </a>{" "}
                        y{" "}
                        <a href="#" className="underline">
                            politica de privacidad
                        </a>
                    </span>
                </p>
                {errorMessage && (
                        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
                    )
                }

                {selectedPayment ? (
                    <PaymentButtons 
                        selectedPayment={selectedPayment}
                        disabled={isPlacingOrder || !hasAvailablePaymentMethods}
                        onPlaceOrder={onPlaceOrder}
                        cart={cart}
                    />
                ) : (
                    <button disabled className="flex justify-center w-full btn-disabled">
                        Pago no disponible temporalmente
                    </button>
                )}
            </div>
        </div>
    );
};
