"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Checkout error:", error);
  }, [error]);

  return (
    <div className="flex justify-center items-center mb-72 px-4 sm:px-0">
      <div className="w-full max-w-2xl rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">No pudimos cargar el checkout</h2>
        <p className="mt-3 text-sm text-gray-600">
          Ocurrió un inconveniente al preparar tu compra. Podés reintentar ahora o volver al carrito.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => reset()}>
            Reintentar
          </button>
          <Link href="/cart" className="btn-secondary">
            Volver al carrito
          </Link>
        </div>
      </div>
    </div>
  );
}
