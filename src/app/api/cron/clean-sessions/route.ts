import { NextRequest, NextResponse } from 'next/server';
import { cleanExpiredOrderSessions, getOrderSessionStats } from '@/actions/checkout/clean-expired-sessions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getExpectedCronToken = () => {
    return process.env.CRON_SECRET || process.env.CRON_AUTH_TOKEN || null;
};

const validateCronAuth = (request: NextRequest) => {
    const expectedToken = getExpectedCronToken();

    if (!expectedToken) {
        return {
            ok: false,
            status: 500,
            error: 'Cron token not configured'
        };
    }

    const authToken = request.headers.get('Authorization');
    if (authToken !== `Bearer ${expectedToken}`) {
        return {
            ok: false,
            status: 401,
            error: 'Unauthorized'
        };
    }

    return { ok: true as const };
};

const runCleanup = async (includeStats: boolean = false) => {
    const sessionCleanupResult = await cleanExpiredOrderSessions();

    const result: {
        timestamp: string;
        sessionCleanup: Awaited<ReturnType<typeof cleanExpiredOrderSessions>>;
        orderSessionStats?: Awaited<ReturnType<typeof getOrderSessionStats>>;
        success: boolean;
    } = {
        timestamp: new Date().toISOString(),
        sessionCleanup: sessionCleanupResult,
        success: true
    };

    if (includeStats) {
        result.orderSessionStats = await getOrderSessionStats();
    }

    return result;
};

/**
 * Endpoint para el proceso programado de limpieza de OrderSessions
 * Se debe llamar cada 5 minutos desde un cron job
 */
export async function POST(request: NextRequest) {
    try {
        const authValidation = validateCronAuth(request);
        if (!authValidation.ok) {
            return NextResponse.json(
                { error: authValidation.error },
                { status: authValidation.status }
            );
        }

        console.log('🚀 Iniciando proceso programado de limpieza de OrderSessions...');

        const result = await runCleanup(true);

        console.log('✅ Proceso programado completado:', result);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('❌ Error en proceso programado:', error);
        
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error.message,
                timestamp: new Date().toISOString()
            }, 
            { status: 500 }
        );
    }
}

/**
 * Endpoint GET para obtener estadísticas de OrderSessions (opcional, para debugging)
 */
export async function GET(request: NextRequest) {
    try {
        const authValidation = validateCronAuth(request);
        if (!authValidation.ok) {
            return NextResponse.json(
                { error: authValidation.error },
                { status: authValidation.status }
            );
        }

        const mode = request.nextUrl.searchParams.get('mode');
        if (mode === 'stats') {
            const stats = await getOrderSessionStats();

            return NextResponse.json({
                timestamp: new Date().toISOString(),
                orderSessionStats: stats,
                success: true
            });
        }

        console.log('🚀 Iniciando proceso programado de limpieza de OrderSessions (GET)...');

        const result = await runCleanup(true);

        console.log('✅ Proceso programado GET completado:', result);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('❌ Error obteniendo estadísticas:', error);
        
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error.message
            }, 
            { status: 500 }
        );
    }
}