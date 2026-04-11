"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cancelCheckoutSession } from "@/actions";

export default function PaymentFailurePage() {
  const [message, setMessage] = useState('Estamos liberando la reserva de tu compra...');
  const [isReleasing, setIsReleasing] = useState(true);

  useEffect(() => {
    const releaseReservation = async () => {
      try {
        const sessionToken = sessionStorage.getItem('current_session_token');

        if (!sessionToken) {
          setMessage('El pago no se completó. Podés volver a intentarlo cuando quieras.');
          return;
        }

        const result = await cancelCheckoutSession(sessionToken);

        sessionStorage.removeItem('current_session_token');
        sessionStorage.removeItem('order_expires_at');

        setMessage(
          result.ok
            ? 'El pago no se completó y liberamos la reserva de stock para que puedas volver a intentarlo.'
            : 'El pago no se completó. Si el stock no se actualiza enseguida, intentá nuevamente en unos minutos.'
        );
      } catch (error) {
        console.error('Error liberando la reserva de checkout:', error);
        setMessage('El pago no se completó. Si el stock no se actualiza enseguida, intentá nuevamente en unos minutos.');
      } finally {
        setIsReleasing(false);
      }
    };

    void releaseReservation();
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen px-4">
      <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-4.293-2.293a1 1 0 00-1.414-1.414L10 8.586 7.707 6.293a1 1 0 00-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 101.414 1.414L10 11.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l2.293-2.293z" clipRule="evenodd" />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-red-800">Pago no completado</h1>
        <p className="mt-3 text-sm text-red-700">{message}</p>

        {isReleasing && (
          <p className="mt-3 text-xs text-red-600">Un momento por favor...</p>
        )}

        <div className="mt-6 space-y-2">
          <Link href="/checkout" className="block btn-primary">
            Intentar nuevamente
          </Link>
          <Link href="/cart" className="block btn-secondary">
            Volver al carrito
          </Link>
        </div>
      </div>
    </div>
  );
}
