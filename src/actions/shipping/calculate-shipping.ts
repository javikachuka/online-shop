'use server'

import { Address } from "@/interfaces";
import { calculateShippingByAmount as utilCalculateShippingByAmount, SHIPPING_CONFIG } from '@/lib/shipping-utils';

interface ShippingCalculation {
    cost: number;
    isFree: boolean;
    method: string;
    reason?: string;
}

// Interfaz para el cálculo completo con dirección
export interface ShippingCalculationWithAddress {
  cost: number;
  isFree: boolean;
  freeShippingThreshold: number;
  method: 'standard' | 'express';
  address: Address;
}

/**
 * Versión simplificada para usar en server actions sin dirección
 * @deprecated Usar calculateShippingByAmount de /lib/shipping-utils directamente
 */
export const calculateShippingByAmount = utilCalculateShippingByAmount;

/**
 * Calcula el costo de envío considerando la dirección y el monto
 * Versión server-side que puede considerar zonas geográficas en el futuro
 * @param address Dirección de envío
 * @param subTotal Subtotal del carrito
 * @param discount Descuentos aplicados
 * @returns Cálculo de envío completo
 */
export const calculateShippingCost = (
    address: Address,
    subTotal: number,
    discount: number = 0
): ShippingCalculationWithAddress => {
    
    const effectiveAmount = subTotal - discount;
    const deliveryMethod = address.deliveryMethod || 'delivery';
    
    // Usar la función que considera el método de entrega
    const { calculateShippingByDeliveryMethod } = require('@/lib/shipping-utils');
    const baseCalculation = calculateShippingByDeliveryMethod(deliveryMethod, effectiveAmount);
    
    // En el futuro, podrías modificar el costo basado en la dirección:
    // if (address.city === 'Ushuaia') baseCalculation.cost += 1000;
    
    return {
        ...baseCalculation,
        address
    };
};

/**
 * Obtiene los métodos de envío disponibles
 * @param address Dirección de envío
 * @param subTotal Subtotal del carrito
 * @param discount Descuentos aplicados
 * @returns Lista de opciones de envío
 */
export const getShippingOptions = (address: Address, subTotal: number, discount: number = 0) => {
    const standardShipping = calculateShippingCost(address, subTotal, discount);
    // Para futuro: implementar express con costo diferente
    const expressShipping = {
        ...standardShipping,
        cost: standardShipping.isFree ? 0 : SHIPPING_CONFIG.EXPRESS_COST,
        method: 'express' as const
    };

    return [
        {
            id: 'standard',
            name: 'Envío Estándar',
            description: '5-7 días hábiles',
            cost: standardShipping.cost,
            isFree: standardShipping.isFree,
            method: standardShipping.method
        },
        {
            id: 'express',
            name: 'Envío Express',
            description: '2-3 días hábiles',
            cost: expressShipping.cost,
            isFree: false, // Express nunca es gratis en FASE 1
            method: expressShipping.method
        }
    ];
};

/**
 * Verifica si una dirección califica para envío gratis
 * @param cartTotal Total del carrito
 * @returns boolean
 */
export const qualifiesForFreeShipping = (cartTotal: number): boolean => {
    return cartTotal >= SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD;
};

/**
 * Obtiene el monto restante para envío gratis
 * @param cartTotal Total del carrito
 * @returns Monto restante o 0 si ya califica
 */
export const getAmountForFreeShipping = (cartTotal: number): number => {
    if (qualifiesForFreeShipping(cartTotal)) {
        return 0;
    }
    return SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD - cartTotal;
};