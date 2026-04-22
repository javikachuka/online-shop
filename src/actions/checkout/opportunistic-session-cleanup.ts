'use server'

import { cleanExpiredOrderSessions } from './clean-expired-sessions';

let lastRunAt = 0;

const parseBooleanEnv = (value: string | undefined, fallback: boolean) => {
    if (value === undefined) return fallback;
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes';
};

const parseNumberEnv = (value: string | undefined, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Limpieza oportunista para complementar el cron (útil en planes free).
 * Se puede desactivar por env sin tocar código.
 */
export const runOpportunisticSessionCleanup = async (context: string) => {
    const enabled = parseBooleanEnv(process.env.ENABLE_OPPORTUNISTIC_SESSION_CLEANUP, true);
    if (!enabled) {
        return { ok: true, skipped: true, reason: 'disabled' as const };
    }

    const sampleRate = Math.max(0, Math.min(1, parseNumberEnv(process.env.OPPORTUNISTIC_SESSION_CLEANUP_SAMPLE_RATE, 0.05)));
    const minIntervalMs = Math.max(60_000, parseNumberEnv(process.env.OPPORTUNISTIC_SESSION_CLEANUP_MIN_INTERVAL_MS, 5 * 60_000));

    if (Math.random() > sampleRate) {
        return { ok: true, skipped: true, reason: 'sampling' as const };
    }

    const now = Date.now();
    if (now - lastRunAt < minIntervalMs) {
        return { ok: true, skipped: true, reason: 'throttled' as const };
    }

    try {
        lastRunAt = now;
        const result = await cleanExpiredOrderSessions();

        console.log('[Opportunistic Session Cleanup] Completed', {
            context,
            cleaned: result.cleaned,
            stockReleased: result.stockReleased,
            deleted: result.deleted
        });

        return {
            ok: true,
            skipped: false,
            result
        };
    } catch (error) {
        // No bloqueamos checkout por un cleanup fallido.
        console.error('[Opportunistic Session Cleanup] Failed', { context, error });
        return {
            ok: false,
            skipped: false,
            error: 'cleanup_failed'
        };
    }
};
