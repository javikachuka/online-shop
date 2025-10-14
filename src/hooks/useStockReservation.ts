'use client'

import { useState, useCallback } from 'react';
import { 
    reserveStockForCheckout,
    processOrderWithReservedStock,
    cancelStockReservation
} from '@/actions/order/process-order-with-stock-reservation';

interface UseStockReservationOptions {
    onReservationSuccess?: (reservationId: string) => void;
    onReservationError?: (error: string) => void;
    onOrderSuccess?: (orderId: string, redirectTo?: string) => void;
    onOrderError?: (error: string) => void;
}

export const useStockReservation = (options: UseStockReservationOptions = {}) => {
    const [isReserving, setIsReserving] = useState(false);
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);
    const [currentReservationId, setCurrentReservationId] = useState<string | null>(null);
    const [reservationExpiry, setReservationExpiry] = useState<Date | null>(null);

    // Reservar stock para checkout
    const reserveStock = useCallback(async (cartItems: any[]) => {
        if (isReserving) return;
        
        try {
            setIsReserving(true);
            const result = await reserveStockForCheckout(cartItems);

            if (result.ok && result.reservationId) {
                setCurrentReservationId(result.reservationId);
                // Calcular tiempo de expiración (15 minutos)
                const expiry = new Date();
                expiry.setMinutes(expiry.getMinutes() + 15);
                setReservationExpiry(expiry);
                
                options.onReservationSuccess?.(result.reservationId);
            } else {
                options.onReservationError?.(result.error || 'Failed to reserve stock');
            }

            return result;
        } catch (error) {
            console.error('Error reserving stock:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            options.onReservationError?.(errorMessage);
            return { ok: false, error: errorMessage };
        } finally {
            setIsReserving(false);
        }
    }, [isReserving, options]);

    // Procesar orden con stock reservado
    const processOrder = useCallback(async (
        paymentId: string, 
        orderData: any
    ) => {
        if (!currentReservationId || isProcessingOrder) return;

        try {
            setIsProcessingOrder(true);
            const result = await processOrderWithReservedStock(
                paymentId,
                currentReservationId,
                orderData
            );

            if (result.ok && result.orderId) {
                setCurrentReservationId(null);
                setReservationExpiry(null);
                options.onOrderSuccess?.(result.orderId, result.redirectTo);
            } else {
                options.onOrderError?.(result.error || 'Failed to process order');
            }

            return result;
        } catch (error) {
            console.error('Error processing order:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            options.onOrderError?.(errorMessage);
            return { ok: false, error: errorMessage };
        } finally {
            setIsProcessingOrder(false);
        }
    }, [currentReservationId, isProcessingOrder, options]);

    // Cancelar reserva
    const cancelReservation = useCallback(async () => {
        if (!currentReservationId) return;

        try {
            const result = await cancelStockReservation(currentReservationId);
            
            if (result.ok) {
                setCurrentReservationId(null);
                setReservationExpiry(null);
            }

            return result;
        } catch (error) {
            console.error('Error canceling reservation:', error);
            return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }, [currentReservationId]);

    // Verificar si la reserva ha expirado
    const isReservationExpired = useCallback(() => {
        if (!reservationExpiry) return false;
        return new Date() > reservationExpiry;
    }, [reservationExpiry]);

    // Obtener tiempo restante de la reserva
    const getRemainingTime = useCallback(() => {
        if (!reservationExpiry) return 0;
        const remaining = reservationExpiry.getTime() - new Date().getTime();
        return Math.max(0, Math.floor(remaining / 1000)); // En segundos
    }, [reservationExpiry]);

    return {
        // States
        isReserving,
        isProcessingOrder,
        currentReservationId,
        reservationExpiry,
        
        // Actions
        reserveStock,
        processOrder,
        cancelReservation,
        
        // Utilities
        isReservationExpired,
        getRemainingTime,
        hasActiveReservation: !!currentReservationId && !isReservationExpired()
    };
};