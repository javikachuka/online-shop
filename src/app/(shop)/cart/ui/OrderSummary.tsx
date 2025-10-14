"use client";

import { useCartStore } from "@/store";
import { useEffect, useState } from "react";
import { currencyFormat } from '../../../../utils/currencyFormat';

export const OrderSummary = () => {

    const [loaded, setLoaded] = useState(false)

    const {itemsInCart, subTotal, tax, total, discount} = useCartStore(state => state.getSummaryInformation())

    useEffect(() => {
        setLoaded(true)
    },[])

    if(!loaded) return <p>loading...</p>

    return (
        <div className="grid grid-cols-2">
            <span>No. Productos</span>
            <span className="text-right">{itemsInCart === 1 ? '1 articulo' : `${itemsInCart} articulos`}</span>

            <span>Sutotal</span>
            <span className="text-right">{currencyFormat(subTotal)}</span>

            {
                discount > 0 && (
                    <>
                        <span>Descuentos</span>
                        <span className="text-right">- {currencyFormat(discount)}</span>
                    </>
                )
            }

            {/* TODO - here show taxes */}

            <span className="text-2xl mt-5">Total:</span>
            <span className="text-2xl mt-5 text-right">{currencyFormat(total)}</span>
        </div>
    );
};
