"use client";

import { useState } from "react";
import { confirmOrCancelOrder } from "@/actions";
import { Toaster, toast } from 'sonner';


export function ConfirmOrderActions({ orderId, isPaid, status }: { orderId: string; isPaid: boolean; status: string|null}) {
    const [open, setOpen] = useState<null | 'confirm' | 'cancel'>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAction = async (actionType: 'confirm' | 'cancel') => {
        setLoading(true);
        setError("");
        try {
            // Aquí deberías llamar a tu endpoint o acción para confirmar/cancelar
            const response = await confirmOrCancelOrder(orderId, actionType)

            if(!response.ok){
                toast.error(`Error al actualizar la orden`);
                return;
            }

            setOpen(null);
            window.location.reload(); // O usa router.refresh() si usas next/navigation
        } catch (e) {
            setError('Ocurrió un error. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex justify-between gap-4 mb-2 mt-2 w-full">
                <button
                    className={`px-4 py-2 rounded font-bold text-white bg-green-600 ${isPaid || status === 'cancelled' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => setOpen('confirm')}
                    disabled={isPaid || status === 'cancelled'}
                >
                    Confirmar pedido
                </button>
                <button
                    className={`px-4 py-2 rounded font-bold text-white bg-red-600 ${isPaid || status === 'cancelled' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => setOpen('cancel')}
                    disabled={isPaid || status === 'cancelled'}
                >
                    Cancelar pedido
                </button>
                {open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="bg-white rounded-lg shadow-lg p-8 min-w-[320px] max-w-[90vw]">
                            <h3 className="text-lg font-bold mb-2">
                                {open === 'confirm' ? '¿Confirmar este pedido?' : '¿Cancelar este pedido?'}
                            </h3>
                            <p className="mb-4 text-sm text-gray-700">
                                {open === 'confirm'
                                    ? 'Esta acción marcará el pedido como pagado. Asegúrate de haber recibido la transferencia por el monto total.'
                                    : 'Esta acción cancelará el pedido y liberará el stock. ¿Estás seguro?'}
                            </p>
                            {error && <div className="text-red-600 mb-2">{error}</div>}
                            <div className="flex gap-4 justify-end">
                                <button
                                    className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold"
                                    onClick={() => setOpen(null)}
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className={`px-4 py-2 rounded font-bold text-white ${open === 'confirm' ? 'bg-green-600' : 'bg-red-600'}`}
                                    onClick={() => handleAction(open)}
                                    disabled={loading}
                                >
                                    {loading ? 'Procesando...' : (open === 'confirm' ? 'Confirmar pedido' : 'Cancelar pedido')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Toaster
                position="bottom-right"
            />
        </>
    );
}
