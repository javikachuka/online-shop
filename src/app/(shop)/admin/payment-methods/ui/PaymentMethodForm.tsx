"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PaymentMethod } from "@/interfaces";
import { saveOrUpdatePaymentMethod } from "@/actions";

interface Props {
  paymentMethod?: PaymentMethod | null;
  onClose: () => void;
}

export const PaymentMethodForm = ({ paymentMethod, onClose }: Props) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: paymentMethod?.name || "",
    description: paymentMethod?.description || "",
    type: paymentMethod?.type || "online",
    discountPercent: paymentMethod?.discountPercent?.toString() || "",
    order: paymentMethod?.order?.toString() || "",
    isEnabled: paymentMethod?.isEnabled ?? true,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    const discountPercent = formData.discountPercent === '' ? null : Number(formData.discountPercent);
    if (discountPercent !== null && (Number.isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100)) {
      setError('El descuento debe estar entre 0 y 100');
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const result = await saveOrUpdatePaymentMethod({
        id: paymentMethod?.id,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        discountPercent,
        order: formData.order === '' ? null : Number(formData.order),
        isEnabled: formData.isEnabled,
      });

      if (!result.ok) {
        setError(result.error || 'No se pudo guardar el método de pago');
        toast.error(result.error || 'No se pudo guardar el método de pago');
        return;
      }

      toast.success(result.message || 'Método de pago guardado con éxito');
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error submitting payment method form:', error);
      setError('Ocurrió un error inesperado al guardar');
      toast.error('Ocurrió un error inesperado al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block font-semibold mb-1">Nombre</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Ej: Mercado Pago, Transferencia bancaria"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Descripción</label>
        <textarea
          className="w-full border rounded px-3 py-2"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Texto visible para el cliente en checkout"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold mb-1">Tipo</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={formData.type}
            onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
            disabled={isSubmitting}
          >
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">Descuento (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            className="w-full border rounded px-3 py-2"
            value={formData.discountPercent}
            onChange={(e) => setFormData((prev) => ({ ...prev, discountPercent: e.target.value }))}
            placeholder="0"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div>
          <label className="block font-semibold mb-1">Orden</label>
          <input
            type="number"
            min="0"
            className="w-full border rounded px-3 py-2"
            value={formData.order}
            onChange={(e) => setFormData((prev) => ({ ...prev, order: e.target.value }))}
            placeholder="0"
            disabled={isSubmitting}
          />
        </div>

        <label className="flex items-center gap-2 mt-6">
          <input
            type="checkbox"
            checked={formData.isEnabled}
            onChange={(e) => setFormData((prev) => ({ ...prev, isEnabled: e.target.checked }))}
            disabled={isSubmitting}
          />
          <span>Habilitado para checkout</span>
        </label>
      </div>

      {error && <div className="text-red-600 font-semibold text-sm">{error}</div>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};
