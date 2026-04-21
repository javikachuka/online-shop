import { useCartStore } from '@/store';
import { calculateShippingByDeliveryMethod, ShippingConfig, DEFAULT_SHIPPING_CONFIG } from '@/lib/shipping-utils';
import { useMemo } from 'react';

export const useOrderSummary = (
  deliveryMethod: 'delivery' | 'pickup' = 'delivery',
  shippingConfig: ShippingConfig = DEFAULT_SHIPPING_CONFIG
) => {
  const cartSummary = useCartStore((state) => state.getSummaryInformation());
  
  // Calcular los costos de envío (lado del cliente)
  const shippingInfo = useMemo(() => {
    const effectiveAmount = cartSummary.subTotal - cartSummary.discount;
    return calculateShippingByDeliveryMethod(deliveryMethod, effectiveAmount, shippingConfig);
  }, [cartSummary.subTotal, cartSummary.discount, deliveryMethod, shippingConfig]);

  const totalWithShipping = cartSummary.total + shippingInfo.cost;
  const effectiveAmount = cartSummary.subTotal - cartSummary.discount;

  return {
    ...cartSummary,
    shippingCost: shippingInfo.cost,
    freeShipping: shippingInfo.isFree,
    freeShippingThreshold: shippingInfo.freeShippingThreshold,
    totalWithShipping,
    // Progreso hacia envío gratis
    progressToFreeShipping: shippingInfo.isFree 
      ? 0 
      : Math.max(0, shippingInfo.freeShippingThreshold - effectiveAmount)
  };
};