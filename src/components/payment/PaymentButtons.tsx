import { PaymentMethod } from "@/interfaces"
import { MercadoPagoButton } from "../mercadopago/MercadoPagoButton";


interface Props {
    selectedPayment: PaymentMethod,
    disabled?: boolean,
    onPlaceOrder?: () => void,
    cart?: any[],
}

export const PaymentButtons = ({selectedPayment, disabled, onPlaceOrder, cart} : Props) => {

    if (selectedPayment.name.replace(/\s/g, "") === "MercadoPago") {
        return (
            <MercadoPagoButton
                text="Pagar con Mercado Pago"
                cart={cart || []}
                paymentMethodId={selectedPayment.id}
                disabled={disabled}
            />
        );
    }
    // Por defecto, renderiza el botón normal
    return (
        <button
            onClick={onPlaceOrder}
            disabled={disabled}
            className={`flex justify-center w-full ${(!disabled) ? 'btn-primary' : 'btn-disabled'}`}
        >
                {selectedPayment?.type === "online" ? "Pagar" : "Finalizar pedido"}
        </button>
    );
}
