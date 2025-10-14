'use client';

import { processApprovedPayment } from "@/actions/payments/process-approved-payment";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store";

interface Props {
  paymentId: string;
  status: string;
}

type OrderStatus = 'checking' | 'approved' | 'pending' | 'rejected' | 'cancelled' | 'error';

export const MercadoPagoSuccessClient = ({ paymentId, status }: Props) => {
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('checking');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('Procesando tu pago...');
  const router = useRouter();
  const clearCartStorage = useCartStore(state => state.clearCart);

  useEffect(() => {
    const processPayment = async () => {
      try {
        setMessage('Validando pago con Mercado Pago...');
        
        // FLUJO HÍBRIDO: Validar directamente con MercadoPago
        // Ahora usamos validateMercadoPagoPayment que maneja OrderSession
        const result = await processApprovedPayment(paymentId);
        
        if (!result.ok) {
          console.error('❌ Error procesando pago:', result.error);
          setError(result.message || result.error || 'Error al procesar el pago');
          setOrderStatus('error');
          return;
        }

        const { status: paymentStatus, orderId, message: resultMessage, clearCart } = result;
        
        // Procesar según el estado del pago
        switch (paymentStatus) {
          case 'approved':
          case 'already_processed':
            setOrderStatus('approved');
            setMessage('¡Pago procesado exitosamente!');
            
            // 🧹 Limpiar carrito si se indica desde el server o siempre en caso de éxito
            if (clearCart || paymentStatus === 'approved' || paymentStatus === 'already_processed') {
                clearCartStorage()
                localStorage.removeItem('cart');
              // TODO: También limpiar store si tienes uno
              // clearCartStore(); 
            }
            
            // Redirigir a la página de la orden
            setTimeout(() => {
              if (orderId) {
                router.replace(`/orders/${orderId}`);
              } else {
                router.replace('/orders');
              }
            }, 2000);
            break;
            
          case 'pending':
            setOrderStatus('pending');
            setMessage('Tu pago está siendo validado...');
            
            // Polling cada 5 segundos para verificar el estado
            setTimeout(() => {
              window.location.reload();
            }, 5000);
            break;
            
          case 'rejected':
            setOrderStatus('rejected');
            setMessage('Tu pago fue rechazado');
            setError('El pago no pudo ser procesado. Por favor intenta nuevamente.');
            break;
            
          case 'cancelled':
            setOrderStatus('cancelled');
            setMessage('El pago fue cancelado');
            setError('El pago fue cancelado. Puedes intentar nuevamente.');
            break;
            
          default:
            setOrderStatus('error');
            setError(resultMessage || 'Estado de pago desconocido');
            break;
        }

      } catch (error: any) {
        console.error('❌ Error en processPayment:', error);
        setError('Error interno al procesar el pago');
        setOrderStatus('error');
      }
    };

    // Solo procesar si el status inicial de MP es approved o pending
    if (status === 'approved' || status === 'pending') {
      processPayment();
    } else {
      setOrderStatus('error');
      setError(`Pago no aprobado. Estado recibido: ${status}`);
    }
  }, [paymentId, status, router]);

  if (orderStatus === 'checking') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{message}</p>
          <p className="text-sm text-gray-500">Por favor, no cierres esta ventana</p>
        </div>
      </div>
    );
  }

  if (orderStatus === 'pending') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center max-w-md p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="w-12 h-12 mx-auto mb-4 text-yellow-600">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Pago en proceso</h2>
          <p className="text-yellow-600 mb-4">{message}</p>
          <p className="text-sm text-gray-500">Verificando tu pago automáticamente...</p>
          <div className="mt-4">
            <div className="animate-pulse flex space-x-1 justify-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || orderStatus === 'error' || orderStatus === 'rejected' || orderStatus === 'cancelled') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center max-w-md p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="w-12 h-12 mx-auto mb-4 text-red-600">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            {orderStatus === 'rejected' ? 'Pago rechazado' : 
             orderStatus === 'cancelled' ? 'Pago cancelado' : 'Error en el pago'}
          </h2>
          <p className="text-red-600 mb-4">{error || message}</p>
          <div className="space-y-2">
            <button 
              onClick={() => router.push('/checkout')}
              className="btn-primary w-full"
            >
              Volver al checkout
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
  }

  // Mostrar mensaje de éxito mientras redirige (orderStatus === 'approved')
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center max-w-md p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="w-12 h-12 mx-auto mb-4 text-green-600">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-green-800 mb-2">¡Pago exitoso!</h2>
        <p className="text-green-600 mb-4">{message}</p>
        <p className="text-sm text-gray-500">Redirigiendo a tu pedido...</p>
      </div>
    </div>
  );
};