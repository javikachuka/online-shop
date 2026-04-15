export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import { getAdminPaymentMethods } from "@/actions";
import { PaymentMethodsAdminClient } from "./ui/PaymentMethodsAdminClient";

export default async function PaymentMethodsPage() {
  const { ok, paymentMethods } = await getAdminPaymentMethods();

  if (!ok) {
    redirect('/auth/login?redirectTo=/admin/payment-methods');
  }

  return <PaymentMethodsAdminClient paymentMethods={paymentMethods} />;
}
