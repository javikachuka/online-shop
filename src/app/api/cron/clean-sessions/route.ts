import { NextRequest, NextResponse } from 'next/server';
import { cleanExpiredOrderSessions, getOrderSessionStats } from '@/actions/checkout/clean-expired-sessions';

/**
 * Endpoint para el proceso programado de limpieza de OrderSessions
 * Se debe llamar cada 5 minutos desde un cron job
 */
export async function POST(request: NextRequest) {
    try {
        // Verificar token de autorización para seguridad
        const authToken = request.headers.get('Authorization');
        const expectedToken = process.env.CRON_AUTH_TOKEN || 'default-cron-token';
        
        if (authToken !== `Bearer ${expectedToken}`) {
            return NextResponse.json(
                { error: 'Unauthorized' }, 
                { status: 401 }
            );
        }

        console.log('🚀 Iniciando proceso programado de limpieza de OrderSessions...');

        // Ejecutar limpieza de OrderSessions expiradas
        const sessionCleanupResult = await cleanExpiredOrderSessions();

        const result = {
            timestamp: new Date().toISOString(),
            sessionCleanup: sessionCleanupResult,
            success: true
        };

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
        const authToken = request.headers.get('Authorization');
        const expectedToken = process.env.CRON_AUTH_TOKEN || 'default-cron-token';
        
        if (authToken !== `Bearer ${expectedToken}`) {
            return NextResponse.json(
                { error: 'Unauthorized' }, 
                { status: 401 }
            );
        }

        const stats = await getOrderSessionStats();

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            orderSessionStats: stats
        });

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