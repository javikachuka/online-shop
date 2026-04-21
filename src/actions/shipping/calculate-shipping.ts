'use server'

import { Address } from "@/interfaces";
import { prisma } from "@/lib/prisma";
import {
    calculateShippingByAmount as utilCalculateShippingByAmount,
    calculateShippingByDeliveryMethod,
    DEFAULT_SHIPPING_CONFIG,
    ShippingConfig
} from '@/lib/shipping-utils';

// Interfaz para el cálculo completo con dirección
export interface ShippingCalculationWithAddress {
  cost: number;
  isFree: boolean;
  freeShippingThreshold: number;
  method: 'standard' | 'express' | 'pickup';
  address: Address;
}

const getShippingConfig = async (): Promise<ShippingConfig> => {
    const defaultCompany = await prisma.company.findFirst({
        where: {
            OR: [{ isDefault: true }, { isActive: true }]
        },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        select: {
            deliveryBaseCost: true,
            freeShippingThreshold: true,
            expressShippingCost: true
        }
    });

    if (!defaultCompany) {
        return DEFAULT_SHIPPING_CONFIG;
    }

    return {
        standardCost: defaultCompany.deliveryBaseCost,
        freeShippingThreshold: defaultCompany.freeShippingThreshold,
        expressCost: defaultCompany.expressShippingCost
    };
};

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
export const calculateShippingCost = async (
    address: Address,
    subTotal: number,
    discount: number = 0
): Promise<ShippingCalculationWithAddress> => {
    
    const effectiveAmount = subTotal - discount;
    const deliveryMethod = address.deliveryMethod || 'delivery';
    const shippingConfig = await getShippingConfig();
    
    const baseCalculation = calculateShippingByDeliveryMethod(deliveryMethod, effectiveAmount, shippingConfig);
    
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
export const getShippingOptions = async (address: Address, subTotal: number, discount: number = 0) => {
    const standardShipping = await calculateShippingCost(address, subTotal, discount);
    const shippingConfig = await getShippingConfig();
    // Para futuro: implementar express con costo diferente
    const expressShipping = {
        ...standardShipping,
        cost: standardShipping.isFree ? 0 : shippingConfig.expressCost,
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
    return cartTotal >= DEFAULT_SHIPPING_CONFIG.freeShippingThreshold;
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
    return DEFAULT_SHIPPING_CONFIG.freeShippingThreshold - cartTotal;
};