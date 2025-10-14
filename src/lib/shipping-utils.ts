export const SHIPPING_CONFIG = {
  STANDARD_COST: 10000,           // $10.000 estándar (coincide con el backend)
  FREE_SHIPPING_THRESHOLD: 120000, // Gratis > $120k (coincide con el backend)
  EXPRESS_COST: 2500,             // $2500 express (futuro)
  METHODS: {
    STANDARD: 'standard',
    EXPRESS: 'express'  // Para futuro
  }
} as const;

export interface ShippingCalculation {
  cost: number;
  isFree: boolean;
  freeShippingThreshold: number;
  method: 'standard' | 'express' | 'pickup';
}

/**
 * Calcula el costo de envío basado en el método de entrega y monto
 * Esta función puede usarse tanto en cliente como servidor
 */
export const calculateShippingByDeliveryMethod = (
  deliveryMethod: 'delivery' | 'pickup',
  amount: number
): ShippingCalculation => {
  
  // Si es retiro en local, siempre es gratis
  if (deliveryMethod === 'pickup') {
    return {
      cost: 0,
      isFree: true,
      freeShippingThreshold: SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD,
      method: 'pickup'
    };
  }
  
  // Si es envío, usar lógica actual
  const isFree = amount >= SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD;
  
  return {
    cost: isFree ? 0 : SHIPPING_CONFIG.STANDARD_COST,
    isFree,
    freeShippingThreshold: SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD,
    method: 'standard'
  };
};

/**
 * Calcula el costo de envío basado en el monto (método original)
 * Esta función puede usarse tanto en cliente como servidor
 */
export const calculateShippingByAmount = (amount: number): ShippingCalculation => {
  return calculateShippingByDeliveryMethod('delivery', amount);
};