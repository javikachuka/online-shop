import Link from "next/link";

interface Props {
  searchParams: {
    payment_id?: string;
  }
}

export default function PaymentPendingPage({ searchParams }: Props) {
  const { payment_id } = searchParams;

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center max-w-md p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="mb-4">
          <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-yellow-800 mb-2">Pago pendiente</h2>
        <p className="text-yellow-700 mb-4">
          Tu pago está siendo procesado. Te notificaremos cuando se complete.
        </p>
        
        {payment_id && (
          <p className="text-sm text-yellow-600 mb-4">
            ID de pago: {payment_id}
          </p>
        )}
        
        <div className="space-y-2">
          <Link href="/orders" className="block btn-primary">
            Ver mis pedidos
          </Link>
          <Link href="/" className="block btn-secondary">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}