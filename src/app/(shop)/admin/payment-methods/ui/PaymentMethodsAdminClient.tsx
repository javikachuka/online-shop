"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { Title } from "@/components";
import { Modal } from "@/components/ui/modal/Modal";
import { PaymentMethod } from "@/interfaces";
import { togglePaymentMethodStatus } from "@/actions";
import { PaymentMethodForm } from "./PaymentMethodForm";

interface Props {
  paymentMethods: PaymentMethod[];
}

export const PaymentMethodsAdminClient = ({ paymentMethods }: Props) => {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const openNewPaymentMethodModal = () => {
    setEditPaymentMethod(null);
    setModalOpen(true);
  };

  const openEditPaymentMethodModal = (paymentMethod: PaymentMethod) => {
    setEditPaymentMethod(paymentMethod);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditPaymentMethod(null);
  };

  const handleToggleStatus = async (paymentMethod: PaymentMethod) => {
    const nextStatus = !paymentMethod.isEnabled;
    const confirmed = window.confirm(
      nextStatus
        ? `¿Habilitar \"${paymentMethod.name}\" para el checkout?`
        : `¿Deshabilitar \"${paymentMethod.name}\" para el checkout?`
    );

    if (!confirmed) return;

    setLoadingId(paymentMethod.id);

    try {
      const result = await togglePaymentMethodStatus(paymentMethod.id, nextStatus);

      if (!result.ok) {
        toast.error(result.error || 'No se pudo actualizar el estado');
        return;
      }

      toast.success(result.message || 'Estado actualizado');
      router.refresh();
    } catch (error) {
      console.error('Error toggling payment method status:', error);
      toast.error('Ocurrió un error inesperado al actualizar el estado');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <>
      <Title title="Mantenimiento de métodos de pago" />

      <div className="flex justify-end mb-5">
        <button className="btn-primary" onClick={openNewPaymentMethodModal}>
          Nuevo método de pago
        </button>
      </div>

      <div className="mb-10 overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-200 border-b">
            <tr>
              <th className="text-sm font-medium text-gray-900 px-6 py-4 text-left">Nombre</th>
              <th className="text-sm font-medium text-gray-900 px-6 py-4 text-left">Tipo</th>
              <th className="text-sm font-medium text-gray-900 px-6 py-4 text-left">Descuento</th>
              <th className="text-sm font-medium text-gray-900 px-6 py-4 text-left">Orden</th>
              <th className="text-sm font-medium text-gray-900 px-6 py-4 text-left">Estado</th>
              <th className="text-sm font-medium text-gray-900 px-6 py-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paymentMethods.length === 0 && (
              <tr className="bg-white border-b">
                <td colSpan={6} className="px-6 py-4 text-sm font-medium text-gray-900 text-center">
                  No hay métodos de pago configurados todavía
                </td>
              </tr>
            )}

            {paymentMethods.map((paymentMethod) => (
              <tr key={paymentMethod.id} className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{paymentMethod.name}</div>
                  {paymentMethod.description && (
                    <div className="text-sm text-gray-500">{paymentMethod.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 capitalize">{paymentMethod.type || '—'}</td>
                <td className="px-6 py-4">
                  {paymentMethod.discountPercent !== null ? `${paymentMethod.discountPercent}%` : 'Sin descuento'}
                </td>
                <td className="px-6 py-4">{paymentMethod.order ?? '—'}</td>
                <td className="px-6 py-4">
                  {paymentMethod.isEnabled ? (
                    <span className="text-green-600 font-semibold">Habilitado</span>
                  ) : (
                    <span className="text-red-600 font-semibold">Deshabilitado</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    className="text-blue-600 hover:underline mr-3"
                    onClick={() => openEditPaymentMethodModal(paymentMethod)}
                  >
                    Editar
                  </button>
                  <button
                    className={`${paymentMethod.isEnabled ? 'text-red-600' : 'text-green-600'} hover:underline disabled:text-gray-400`}
                    onClick={() => handleToggleStatus(paymentMethod)}
                    disabled={loadingId === paymentMethod.id}
                  >
                    {loadingId === paymentMethod.id
                      ? 'Actualizando...'
                      : paymentMethod.isEnabled
                        ? 'Deshabilitar'
                        : 'Habilitar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editPaymentMethod ? 'Editar método de pago' : 'Nuevo método de pago'}
      >
        <PaymentMethodForm paymentMethod={editPaymentMethod} onClose={closeModal} />
      </Modal>

      <Toaster position="bottom-right" />
    </>
  );
};
