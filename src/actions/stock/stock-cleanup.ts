'use server'

import { cleanExpiredReservations } from './stock-reservation';

/**
 * Función que debe ejecutarse periódicamente para limpiar reservas expiradas
 * Se puede llamar desde un cron job o desde middleware
 */
export async function runStockCleanup() {
    console.log('[Stock Cleanup] Starting cleanup of expired reservations...');
    
    const result = await cleanExpiredReservations();
    
    if (result.ok) {
        console.log(`[Stock Cleanup] Successfully cleaned ${result.cleanedCount} expired reservations`);
    } else {
        console.error('[Stock Cleanup] Failed to clean expired reservations:', result.error);
    }
    
    return result;
}

/**
 * Middleware para limpiar reservas expiradas en cada request importante
 * (como checkout, payment, etc.)
 */
export async function ensureStockCleanup() {
    // Solo ejecutar limpieza ocasionalmente para no sobrecargar
    const shouldClean = Math.random() < 0.1; // 10% de las veces
    
    if (shouldClean) {
        console.log('[Stock Cleanup] Running automatic cleanup...');
        await runStockCleanup();
    }
}