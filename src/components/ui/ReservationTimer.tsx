'use client'

import { useState, useEffect } from 'react';
import { MdAccessTime } from 'react-icons/md';

interface ReservationTimerProps {
    expiryDate: Date;
    onExpired?: () => void;
    className?: string;
}

export const ReservationTimer = ({ 
    expiryDate, 
    onExpired, 
    className = "" 
}: ReservationTimerProps) => {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date().getTime();
            const expiry = expiryDate.getTime();
            const remaining = Math.max(0, expiry - now);
            
            setTimeLeft(Math.floor(remaining / 1000));
            
            if (remaining <= 0 && onExpired) {
                onExpired();
            }
        };

        // Actualizar inmediatamente
        updateTimer();
        
        // Actualizar cada segundo
        const interval = setInterval(updateTimer, 1000);
        
        return () => clearInterval(interval);
    }, [expiryDate, onExpired]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getColorClass = () => {
        if (timeLeft <= 0) return 'text-red-500';
        if (timeLeft <= 300) return 'text-orange-500'; // Últimos 5 minutos
        return 'text-green-600';
    };

    if (timeLeft <= 0) {
        return (
            <div className={`flex items-center gap-1 text-red-500 ${className}`}>
                <MdAccessTime size={16} />
                <span className="text-sm font-medium">Reserva expirada</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-1 ${getColorClass()} ${className}`}>
            <MdAccessTime size={16} />
            <span className="text-sm font-medium">
                Stock reservado por: {formatTime(timeLeft)}
            </span>
        </div>
    );
};