'use client'

import { useEffect, useState } from 'react';
import { getAvailableStock } from '@/actions/stock/stock-reservation';

interface StockDisplayProps {
    variantId: string;
    totalStock: number;
    className?: string;
}

export const StockDisplay = ({ variantId, totalStock, className = "" }: StockDisplayProps) => {
    const [availableStock, setAvailableStock] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAvailableStock = async () => {
            try {
                setIsLoading(true);
                const available = await getAvailableStock(variantId);
                setAvailableStock(available);
            } catch (error) {
                console.error('Error fetching available stock:', error);
                setAvailableStock(totalStock); // Fallback al stock total
            } finally {
                setIsLoading(false);
            }
        };

        fetchAvailableStock();
    }, [variantId, totalStock]);

    if (isLoading) {
        return (
            <div className={`text-sm text-gray-500 ${className}`}>
                Verificando disponibilidad...
            </div>
        );
    }

    const stock = availableStock ?? totalStock;
    const isReserved = availableStock !== null && availableStock < totalStock;
    const reservedQuantity = totalStock - (availableStock ?? totalStock);

    const getStockColor = () => {
        if (stock === 0) return 'text-red-500';
        if (stock <= 3) return 'text-orange-500';
        return 'text-green-600';
    };

    const getStockText = () => {
        if (stock === 0) return 'Sin stock';
        if (stock === 1) return '1 disponible';
        if (stock <= 10) return `${stock} disponibles`;
        return 'En stock';
    };

    return (
        <div className={`text-sm ${className}`}>
            <span className={getStockColor()}>
                {getStockText()}
            </span>
            {isReserved && reservedQuantity > 0 && (
                <span className="text-xs text-gray-400 ml-2">
                    ({reservedQuantity} reservado{reservedQuantity !== 1 ? 's' : ''})
                </span>
            )}
        </div>
    );
};