export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import { getAdminPaymentMethods } from "@/actions";
import { PaymentMethodsAdminClient } from "./ui/PaymentMethodsAdminClient";

export default async function PaymentMethodsPage() {
  const { ok, paymentMethods } = await getAdminPaymentMethods();

  if (!ok) {
    return <div className="text-red-500 text-lg">No se pudieron cargar los métodos de pago.</div>;
  }

  return <PaymentMethodsAdminClient paymentMethods={paymentMethods} />;
}
