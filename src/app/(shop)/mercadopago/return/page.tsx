import { createOrderAfterPayment } from "@/actions";
import { redirect } from "next/navigation";

interface Props {
  searchParams: {
    payment_id?: string;
    status?: string;
    merchant_order_id?: string;
  }
}

export default async function MercadoPagoReturnPage({ searchParams }: Props) {
  const { payment_id, status, merchant_order_id } = searchParams;

  // Si no tenemos los parámetros necesarios, redirigir al checkout
  if (!payment_id || !status) {
    redirect('/checkout?error=invalid_payment');
  }

  // Si el pago fue exitoso
  if (status === 'approved') {
    // En una implementación real, aquí deberías:
    // 1. Recuperar orderData del sessionStorage (desde el cliente)
    // 2. Verificar el pago con MercadoPago
    // 3. Crear la orden en la base de datos
    
    // Por ahora, simplemente redirigimos a una página de éxito
    redirect(`/orders/payment-success?payment_id=${payment_id}`);
  }

  // Si el pago falló o fue cancelado
  if (status === 'rejected' || status === 'cancelled') {
    redirect('/checkout?error=payment_failed');
  }

  // Estados pendientes
  if (status === 'pending' || status === 'in_process') {
    redirect(`/orders/payment-pending?payment_id=${payment_id}`);
  }

  // Estado desconocido
  redirect('/checkout?error=unknown_payment_status');
}