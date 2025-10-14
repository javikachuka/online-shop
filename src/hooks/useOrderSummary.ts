import { useCartStore } from '@/store';
import { calculateShippingByDeliveryMethod } from '@/lib/shipping-utils';
import { useMemo } from 'react';

export const useOrderSummary = (deliveryMethod: 'delivery' | 'pickup' = 'delivery') => {
  const cartSummary = useCartStore((state) => state.getSummaryInformation());
  
  // Calcular los costos de envío (lado del cliente)
  const shippingInfo = useMemo(() => {
    const effectiveAmount = cartSummary.subTotal - cartSummary.discount;
    return calculateShippingByDeliveryMethod(deliveryMethod, effectiveAmount);
  }, [cartSummary.subTotal, cartSummary.discount, deliveryMethod]);

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