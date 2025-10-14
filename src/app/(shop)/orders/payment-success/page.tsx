import { MercadoPagoSuccessClient } from "@/components/mercadopago/MercadoPagoSuccessClient";

interface Props {
  searchParams: {
    payment_id?: string;
  }
}

export default function PaymentSuccessPage({ searchParams }: Props) {
  const { payment_id } = searchParams;

  if (!payment_id) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p>No se encontró información del pago</p>
        </div>
      </div>
    );
  }

  return <MercadoPagoSuccessClient paymentId={payment_id} status="approved" />;
}