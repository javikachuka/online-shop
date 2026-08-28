"use client";

import Link from "next/link";
import { useRef } from "react";
import { useCartStore } from "@/store";
import { useAnalytics } from "@/hooks";
import { cartToGaItems, cartToGaValue } from "@/utils/analytics-mappers";

export const BeginCheckoutButton = () => {
    const cart = useCartStore((state) => state.cart);
    const { trackBeginCheckout } = useAnalytics();
    const hasTracked = useRef(false);

    const handleClick = () => {
        if (hasTracked.current || cart.length === 0) return;
        hasTracked.current = true;

        trackBeginCheckout({
            currency: 'ARS',
            value: cartToGaValue(cart),
            items: cartToGaItems(cart),
        });
    };

    return (
        <Link
            className="flex btn-primary justify-center"
            href={'/checkout/address'}
            onClick={handleClick}
        >
            Continuar
        </Link>
    );
};
