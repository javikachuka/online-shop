"use client";

import { useState } from "react";
import { confirmOrCancelOrder, markOrderAsDelivered } from "@/actions";
import { Toaster, toast } from 'sonner';


export function ConfirmOrderActions({ orderId, isPaid, status, orderStatus }: { orderId: string; isPaid: boolean; status: string|null; orderStatus: string|null }) {
    const [open, setOpen] = useState<null | 'confirm' | 'cancel' | 'deliver'>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAction = async (actionType: 'confirm' | 'cancel' | 'deliver') => {
        setLoading(true);
        setError("");
        try {
            let response;
            
            if (actionType === 'deliver') {
                response = await markOrderAsDelivered(orderId);
            } else {
                response = await confirmOrCancelOrder(orderId, actionType);
            }

            if(!response.ok){
                toast.error(`Error al actualizar la orden: ${response.error || 'Error desconocido'}`);
                setError(response.error || 'Error al actualizar la orden');
                return;
            }

            toast.success(`Orden ${actionType === 'deliver' ? 'marcada como entregada' : actionType === 'confirm' ? 'confirmada' : 'cancelada'} exitosamente`);
            setOpen(null);
            window.location.reload(); // O usa router.refresh() si usas next/navigation
        } catch (e) {
            const errorMessage = 'Ocurrió un error. Intenta nuevamente.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Determinar qué botones mostrar basado en el estado
    const canConfirm = !isPaid && status !== 'cancelled' && orderStatus !== 'delivered';
    const canCancel = !isPaid && status !== 'cancelled' && orderStatus !== 'delivered';
    const canMarkAsDelivered = isPaid && status === 'approved' && orderStatus !== 'delivered';

    return (
        <>
            <div className="flex flex-col gap-2 mb-2 mt-2 w-full">
                {/* Botones de confirmación/cancelación - solo si la orden no está pagada */}
                {!isPaid && (
                    <div className="flex justify-between gap-4">
                        <button
                            className={`px-4 py-2 rounded font-bold text-white bg-green-600 ${!canConfirm ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => setOpen('confirm')}
                            disabled={!canConfirm}
                        >
                            Confirmar pedido
                        </button>
                        <button
                            className={`px-4 py-2 rounded font-bold text-white bg-red-600 ${!canCancel ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => setOpen('cancel')}
                            disabled={!canCancel}
                        >
                            Cancelar pedido
                        </button>
                    </div>
                )}

                {/* Botón de marcar como entregado - solo si está pagada */}
                {canMarkAsDelivered && (
                    <button
                        className="px-4 py-2 rounded font-bold text-white bg-blue-600 w-full"
                        onClick={() => setOpen('deliver')}
                    >
                        📦 Marcar como entregado
                    </button>
                )}
                {open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="bg-white rounded-lg shadow-lg p-8 min-w-[320px] max-w-[90vw]">
                            <h3 className="text-lg font-bold mb-2">
                                {open === 'confirm' 
                                    ? '¿Confirmar este pedido?' 
                                    : open === 'cancel' 
                                    ? '¿Cancelar este pedido?'
                                    : '¿Marcar como entregado?'}
                            </h3>
                            <p className="mb-4 text-sm text-gray-700">
                                {open === 'confirm'
                                    ? 'Esta acción marcará el pedido como pagado. Asegúrate de haber recibido la transferencia por el monto total.'
                                    : open === 'cancel'
                                    ? 'Esta acción cancelará el pedido y liberará el stock. ¿Estás seguro?'
                                    : 'Esta acción marcará el pedido como entregado. Confirma que el cliente ya recibió todos los productos de su orden.'}
                            </p>
                            {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
                            <div className="flex gap-4 justify-end">
                                <button
                                    className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold"
                                    onClick={() => setOpen(null)}
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className={`px-4 py-2 rounded font-bold text-white ${
                                        open === 'confirm' ? 'bg-green-600' : 
                                        open === 'cancel' ? 'bg-red-600' : 
                                        'bg-blue-600'
                                    }`}
                                    onClick={() => handleAction(open)}
                                    disabled={loading}
                                >
                                    {loading ? 'Procesando...' : (
                                        open === 'confirm' ? 'Confirmar pedido' : 
                                        open === 'cancel' ? 'Cancelar pedido' : 
                                        'Marcar como entregado'
                                    )}
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
