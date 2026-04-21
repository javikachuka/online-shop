export interface ShippingConfig {
  standardCost: number;
  freeShippingThreshold: number;
  expressCost: number;
}

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  standardCost: 10000,
  freeShippingThreshold: 120000,
  expressCost: 2500
};

export const SHIPPING_METHODS = {
  STANDARD: 'standard',
  EXPRESS: 'express'
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
  amount: number,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG
): ShippingCalculation => {
  
  // Si es retiro en local, siempre es gratis
  if (deliveryMethod === 'pickup') {
    return {
      cost: 0,
      isFree: true,
      freeShippingThreshold: config.freeShippingThreshold,
      method: 'pickup'
    };
  }
  
  // Si es envío, usar lógica actual
  const isFree = amount >= config.freeShippingThreshold;
  
  return {
    cost: isFree ? 0 : config.standardCost,
    isFree,
    freeShippingThreshold: config.freeShippingThreshold,
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