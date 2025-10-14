"use client";

import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { CreateOrderData, CreateOrderActions, OnApproveData, OnApproveActions } from "@paypal/paypal-js";
import { paypalCheckPayment, setOrderTransactionId } from "@/actions";

interface Props {
    orderId: string;
    amount: number;
}

export const PayPalButton = ({orderId, amount} : Props) => {
    const [{ isPending }] = usePayPalScriptReducer();

    const roundedAmount = (Math.round(amount * 100)) / 100


    if (isPending) {
        return (
            <div className="animate-pulse mb-12">
                <div className="h-11 bg-gray-300 rounded">
                </div>

                <div className="h-11 bg-gray-300 rounded mt-2">
                </div>
            </div>
        )
    }

    const createOrder = async (data: CreateOrderData, actions: CreateOrderActions) => {

        console.log('creando');
        
        const transactionId = await actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
                {
                    invoice_id: orderId,
                    amount: {
                        currency_code: 'USD',
                        value: `${roundedAmount}`
                    }
                }
            ]
        })

        const updateOrderResponse = await setOrderTransactionId(orderId, transactionId)
        if (!updateOrderResponse.ok) {
            throw new Error(updateOrderResponse.error || "Error al actualizar el ID de transacción del pedido");
        }
        
        console.log(updateOrderResponse);
        
        

        return transactionId
    }

    const onApprove = async (data: OnApproveData, actions: OnApproveActions) => {
        const details = await await actions.order?.capture();

        if (!details) {
            throw new Error("No se pudo capturar el pago");
        }

        if (!details.id) {
            throw new Error("No se encontró el ID de la transacción en los detalles del pago");
        }
        const onApproveResponse = await paypalCheckPayment(details.id)

        console.log({onApproveResponse});
        
    }

    return (
        <PayPalButtons 
            createOrder={createOrder}
            onApprove={onApprove}
        />
    )
};
