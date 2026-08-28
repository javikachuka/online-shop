'use client';

import { useEffect } from 'react';
import { useAnalytics } from '@/hooks';
import { hasTrackedPurchase, markPurchaseTracked } from '@/utils/analytics-dedupe';
import { OrderAnalyticsSummary } from '@/types/analytics';

interface Props {
    orderId: string;
    analytics: OrderAnalyticsSummary;
}

// Dispara `purchase` una única vez, recién cuando la orden está confirmada como pagada
// (ej. transferencia verificada por el admin), evitando contar ventas que luego se cancelan.
export const OrderPurchaseTracker = ({ orderId, analytics }: Props) => {
    const { trackPurchase } = useAnalytics();

    useEffect(() => {
        if (hasTrackedPurchase(orderId)) return;

        trackPurchase({
            transaction_id: orderId,
            value: analytics.value,
            currency: 'ARS',
            shipping: analytics.shipping,
            tax: analytics.tax,
            coupon: analytics.coupon,
            items: analytics.items,
        });
        markPurchaseTracked(orderId);
    }, [orderId, analytics, trackPurchase]);

    return null;
};
