"use client";

import { useMemo, useState } from 'react';
import { createAdminStockMovement } from '@/actions/stock/admin-stock-movements';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';

interface VariantRow {
  id: string;
  sku: string | null;
  stock: number;
  price: number;
  updatedAt: Date | null;
  product: {
    id: string;
    title: string;
    slug: string;
  };
}

interface MovementRow {
  id: string;
  type: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string | null;
  createdAt: Date;
  variant: {
    sku: string | null;
    product: {
      title: string;
      slug: string;
    };
  };
  actorUser: {
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface Props {
  variants: VariantRow[];
  movements: MovementRow[];
}

export const StockAdminPanel = ({ variants, movements }: Props) => {
  const router = useRouter();
  const [selectedVariantId, setSelectedVariantId] = useState<string>(variants[0]?.id ?? '');
  const [movementType, setMovementType] = useState<'RESTOCK' | 'ADJUSTMENT'>('RESTOCK');
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId),
    [selectedVariantId, variants]
  );

  const handleUseVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSubmitting) return;

    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity === 0) {
      toast.error('La cantidad debe ser un número distinto de 0');
      return;
    }

    if (movementType === 'RESTOCK' && parsedQuantity < 0) {
      toast.error('Para restock usá una cantidad positiva');
      return;
    }

    setIsSubmitting(true);

    const result = await createAdminStockMovement({
      variantId: selectedVariantId,
      movementType,
      quantity: parsedQuantity,
      reason,
    });

    if (!result.ok) {
      toast.error(result.error || 'No se pudo registrar el movimiento');
      setIsSubmitting(false);
      return;
    }

    toast.success(result.message || 'Movimiento registrado');
    setReason('');
    setQuantity('1');
    setIsSubmitting(false);
    router.refresh();
  };

  return (
    <div className="space-y-6 pb-16">
      <section className="rounded-md border bg-white p-4">
        <h2 className="mb-4 text-xl font-semibold">Registrar Movimiento</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Variante</label>
            <select
              className="rounded border p-2"
              value={selectedVariantId}
              onChange={(event) => setSelectedVariantId(event.target.value)}
              required
            >
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.product.title} | SKU: {variant.sku || 'sin-sku'} | Stock: {variant.stock}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Tipo</label>
            <select
              className="rounded border p-2"
              value={movementType}
              onChange={(event) => setMovementType(event.target.value as 'RESTOCK' | 'ADJUSTMENT')}
            >
              <option value="RESTOCK">Restock (ingreso)</option>
              <option value="ADJUSTMENT">Ajuste (+/-)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Cantidad</label>
            <input
              type="number"
              className="rounded border p-2"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
            />
            <span className="text-xs text-gray-500">
              {movementType === 'RESTOCK'
                ? 'Usar valor positivo. Ej: 15'
                : 'Podés usar positivos o negativos. Ej: -2 / 5'}
            </span>
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium">Motivo (opcional)</label>
            <textarea
              className="rounded border p-2"
              rows={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ej: ingreso por compra a proveedor / corrección de inventario"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !selectedVariantId}
            >
              {isSubmitting ? 'Guardando...' : 'Registrar movimiento'}
            </button>
          </div>
        </form>

        {selectedVariant && (
          <p className="mt-3 text-sm text-gray-600">
            Stock actual de la variante seleccionada: <strong>{selectedVariant.stock}</strong>
          </p>
        )}
      </section>

      <section className="rounded-md border bg-white p-4">
        <h2 className="mb-4 text-xl font-semibold">Variantes (stock actual)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm">Producto</th>
                <th className="px-4 py-2 text-left text-sm">SKU</th>
                <th className="px-4 py-2 text-left text-sm">Stock</th>
                <th className="px-4 py-2 text-left text-sm">Última actualización</th>
                <th className="px-4 py-2 text-left text-sm">Acción</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant.id} className="border-b">
                  <td className="px-4 py-2 text-sm">{variant.product.title}</td>
                  <td className="px-4 py-2 text-sm">{variant.sku || '-'}</td>
                  <td className="px-4 py-2 text-sm font-semibold">{variant.stock}</td>
                  <td className="px-4 py-2 text-sm">{variant.updatedAt ? new Date(variant.updatedAt).toLocaleString() : '-'}</td>
                  <td className="px-4 py-2 text-sm">
                    <button
                      type="button"
                      className="text-blue-700 underline"
                      onClick={() => handleUseVariant(variant.id)}
                    >
                      Usar en formulario
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-md border bg-white p-4">
        <h2 className="mb-4 text-xl font-semibold">Últimos Movimientos</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm">Fecha</th>
                <th className="px-4 py-2 text-left text-sm">Producto / SKU</th>
                <th className="px-4 py-2 text-left text-sm">Tipo</th>
                <th className="px-4 py-2 text-left text-sm">Cantidad</th>
                <th className="px-4 py-2 text-left text-sm">Antes</th>
                <th className="px-4 py-2 text-left text-sm">Después</th>
                <th className="px-4 py-2 text-left text-sm">Usuario</th>
                <th className="px-4 py-2 text-left text-sm">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-500" colSpan={8}>
                    Todavía no hay movimientos registrados.
                  </td>
                </tr>
              )}
              {movements.map((movement) => (
                <tr key={movement.id} className="border-b">
                  <td className="px-4 py-2 text-sm">{new Date(movement.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm">
                    {movement.variant.product.title} / {movement.variant.sku || '-'}
                  </td>
                  <td className="px-4 py-2 text-sm">{movement.type}</td>
                  <td className="px-4 py-2 text-sm font-semibold">{movement.quantity}</td>
                  <td className="px-4 py-2 text-sm">{movement.stockBefore}</td>
                  <td className="px-4 py-2 text-sm">{movement.stockAfter}</td>
                  <td className="px-4 py-2 text-sm">
                    {movement.actorUser
                      ? `${movement.actorUser.firstName || ''} ${movement.actorUser.lastName || ''}`.trim() || movement.actorUser.email
                      : '-'}
                  </td>
                  <td className="px-4 py-2 text-sm">{movement.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Toaster position="bottom-right" />
    </div>
  );
};
