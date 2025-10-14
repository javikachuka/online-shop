'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface OrderStatusResult {
    ok: boolean;
    order?: {
        id: string;
        orderStatus: string;
        total: number;
        createdAt: string;
        reservationExpiresAt?: string;
    };
    error?: string;
}

export const PaymentStatusHandler = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [orderStatus, setOrderStatus] = useState<OrderStatusResult | null>(null);
    
    // Obtener parámetros de MP
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('status');
    const merchantOrderId = searchParams.get('merchant_order_id');

    const handleOrderStatus = useCallback((order: any) => {
        switch (order.orderStatus) {
            case 'paid':
                // Limpiar datos del checkout
                sessionStorage.removeItem('current_order_id');
                sessionStorage.removeItem('order_expires_at');
                localStorage.removeItem('cart');
                
                // Redirigir después de 3 segundos
                setTimeout(() => {
                    router.replace(`/orders/${order.id}`);
                }, 3000);
                break;

            case 'pending_payment':
                // Mantener en espera, el webhook puede aún procesar
                setTimeout(() => {
                    window.location.reload();
                }, 10000); // Recargar después de 10 segundos
                break;

            case 'cancelled':
            case 'expired':
                // Limpiar datos y mostrar error
                sessionStorage.removeItem('current_order_id');
                sessionStorage.removeItem('order_expires_at');
                
                setTimeout(() => {
                    router.replace('/checkout?error=payment_failed');
                }, 5000);
                break;
        }
    }, [router]);

    useEffect(() => {
        const checkOrderStatus = async () => {
            try {
                // Obtener orden ID del sessionStorage
                const currentOrderId = sessionStorage.getItem('current_order_id');
                
                if (!currentOrderId) {
                    throw new Error('No se encontró información de la orden');
                }

                // Consultar estado actual de la orden
                const response = await fetch(`/api/orders/${currentOrderId}/status`);
                const result: OrderStatusResult = await response.json();

                setOrderStatus(result);

                if (result.ok && result.order) {
                    handleOrderStatus(result.order);
                } else {
                    throw new Error(result.error || 'Error consultando estado de la orden');
                }

            } catch (error: any) {
                console.error('Error checking order status:', error);
                setOrderStatus({
                    ok: false,
                    error: error.message
                });
            } finally {
                setIsLoading(false);
            }
        };

        // Dar tiempo a que el webhook procese el pago
        const timer = setTimeout(checkOrderStatus, 3000);
        
        return () => clearTimeout(timer);
    }, [paymentId, handleOrderStatus]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verificando estado de tu pago...</p>
                    <p className="text-sm text-gray-500">Por favor, no cierres esta ventana</p>
                </div>
            </div>
        );
    }

    if (!orderStatus?.ok || !orderStatus.order) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center max-w-md p-6 bg-red-50 border border-red-200 rounded-lg">
                    <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
                    <p className="text-red-600 mb-4">{orderStatus?.error || 'Error desconocido'}</p>
                    <button 
                        onClick={() => router.push('/checkout')}
                        className="btn-primary w-full"
                    >
                        Volver al checkout
                    </button>
                </div>
            </div>
        );
    }

    const { order } = orderStatus;

    // Renderizar según el estado de la orden
    switch (order.orderStatus) {
        case 'paid':
            return (
                <div className="flex justify-center items-center min-h-screen">
                    <div className="text-center max-w-md p-6 bg-green-50 border border-green-200 rounded-lg">
                        <div className="w-16 h-16 mx-auto mb-4 text-green-600">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-green-800 mb-2">¡Pago exitoso!</h2>
                        <p className="text-green-600 mb-2">Tu pedido ha sido procesado correctamente</p>
                        <p className="text-sm text-gray-600 mb-4">
                            Orden: <span className="font-mono">{order.id}</span>
                        </p>
                        <p className="text-sm text-gray-500">Redirigiendo a tu pedido...</p>
                    </div>
                </div>
            );

        case 'pending_payment':
            return (
                <div className="flex justify-center items-center min-h-screen">
                    <div className="text-center max-w-md p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="w-12 h-12 mx-auto mb-4 text-yellow-600">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-yellow-800 mb-2">Pago en validación</h2>
                        <p className="text-yellow-700 mb-2">Tu pago está siendo procesado</p>
                        <p className="text-sm text-gray-600 mb-4">
                            Orden: <span className="font-mono">{order.id}</span>
                        </p>
                        <p className="text-sm text-gray-500">Verificando nuevamente en unos segundos...</p>
                    </div>
                </div>
            );

        case 'cancelled':
            return (
                <div className="flex justify-center items-center min-h-screen">
                    <div className="text-center max-w-md p-6 bg-red-50 border border-red-200 rounded-lg">
                        <div className="w-12 h-12 mx-auto mb-4 text-red-600">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8.707-3.293a1 1 0 00-1.414 1.414L9.586 10l-1.293 1.293a1 1 0 101.414 1.414L11 11.414l1.293 1.293a1 1 0 001.414-1.414L12.414 10l1.293-1.293a1 1 0 00-1.414-1.414L11 8.586 9.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-red-800 mb-2">Pago cancelado</h2>
                        <p className="text-red-600 mb-4">El pago no pudo ser procesado</p>
                        <div className="space-y-2">
                            <button 
                                onClick={() => router.push('/checkout')}
                                className="btn-primary w-full"
                            >
                                Intentar nuevamente
                            </button>
                            <button 
                                onClick={() => router.push('/orders')}
                                className="btn-secondary w-full"
                            >
                                Ver mis pedidos
                            </button>
                        </div>
                    </div>
                </div>
            );

        case 'expired':
            return (
                <div className="flex justify-center items-center min-h-screen">
                    <div className="text-center max-w-md p-6 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="w-12 h-12 mx-auto mb-4 text-orange-600">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-orange-800 mb-2">Orden expirada</h2>
                        <p className="text-orange-600 mb-4">El tiempo de reserva ha vencido</p>
                        <div className="space-y-2">
                            <button 
                                onClick={() => router.push('/checkout')}
                                className="btn-primary w-full"
                            >
                                Crear nueva orden
                            </button>
                        </div>
                    </div>
                </div>
            );

        default:
            return (
                <div className="flex justify-center items-center min-h-screen">
                    <div className="text-center max-w-md p-6 bg-gray-50 border border-gray-200 rounded-lg">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Estado desconocido</h2>
                        <p className="text-gray-600 mb-4">Estado: {order.orderStatus}</p>
                        <button 
                            onClick={() => router.push('/orders')}
                            className="btn-secondary w-full"
                        >
                            Ver mis pedidos
                        </button>
                    </div>
                </div>
            );
    }
};