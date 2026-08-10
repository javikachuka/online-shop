import { MercadoPagoSuccessClient } from "@/components/mercadopago/MercadoPagoSuccessClient";

interface Props {
  searchParams: Promise<{
    payment_id?: string;
  }>
}

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const { payment_id } = resolvedSearchParams;

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