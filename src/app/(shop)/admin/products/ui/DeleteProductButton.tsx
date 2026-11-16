'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { setProductEnabled } from '@/actions/product/set-product-enabled';

interface Props {
  productId: string;
  productTitle: string;
}

export const DeleteProductButton = ({ productId, productTitle }: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = await setProductEnabled(productId, false);

      if (!response.ok) {
        toast.error(response.error || 'No se pudo eliminar el producto');
        return;
      }

      toast.success('Producto desactivado correctamente');
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('Ocurrió un error al desactivar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-red-600 hover:underline"
      >
        Eliminar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw]">
            <h3 className="text-lg font-bold mb-2">¿Eliminar producto?</h3>
            <p className="mb-4 text-sm text-gray-700">
              Esta acción realizará una eliminación lógica del producto{' '}
              <span className="font-semibold">“{productTitle}”</span>. El producto se desactivará y no
              aparecerá en los listados generales, pero se conservará por su historial en transacciones.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded font-bold text-white bg-red-600 disabled:opacity-50"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Toaster position="bottom-right" />
    </>
  );
};
