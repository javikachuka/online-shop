import { getDefaultCompany, getOrderByIdAdmin } from "@/actions";
import { MercadoPagoButton, OrderStatus, PayPalButton, ProductImage, Title } from "@/components";
import { currencyFormat, getNameAttributes } from "@/utils";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IoBanOutline, IoCartOutline, IoWalletOutline } from "react-icons/io5";
import { ConfirmOrderActions } from "./ConfirmOrderActions.client";

interface Props {
    params: {
        id: string;
    };
}

export default async function CategoryPage({ params }: Props) {
    const { id } = params;

    const orderData = await getOrderByIdAdmin(id);

    const companyData = await getDefaultCompany()

    console.log(orderData.order?.OrderItem);
    
    
    if(orderData.ok === false) {
        redirect("/orders");
    }


    if (!orderData.ok) {
        return (
            <div className="flex justify-center items-center mb-72 px-10 sm:px-0">
                <div className="flex flex-col w-[1000px]">
                    <Title title="Pedido no encontrado"></Title>
                    <p className="text-red-500">
                        No se pudo encontrar el pedido.
                    </p>
                    <Link href="/orders" className="underline text-blue-500">
                        Volver a las órdenes
                    </Link>
                </div>
            </div>
        );
    }

    const orderItems = orderData.order?.OrderItem || [];

    return (
        <div className="flex justify-center items-center mb-72 px-10 sm:px-0">
            <div className="flex flex-col w-[1000px]">
                <Title title={`Pedido #${id.split("-").at(-1)}`}></Title>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                    {/* Carrito */}
                    <div className="flex flex-col mt-5">
                        {orderData.order?.isPaid ? (
                            <OrderStatus
                                status={"Pagada"}
                                Icon={IoWalletOutline}
                                colorClass="bg-green-700" />
                        ) : orderData.order?.paymentStatus === 'cancelled' ?
                            (
                                <OrderStatus
                                    status={"Cancelada"}
                                    Icon={IoBanOutline}
                                    colorClass="bg-red-500" />
                            ) :
                        
                            (
                                <OrderStatus
                                    status={"Pendiente de pago"}
                                    Icon={IoCartOutline}
                                    colorClass="bg-red-500" />
                            )
                        }

                        {/* Items */}
                        {orderItems.map((item) => (
                            <div key={item.product.slug} className="flex mb-5">
                                <ProductImage
                                    src={item.product.ProductImage[0]?.url}
                                    height={100}
                                    width={100}
                                    alt={item.product.title}
                                    className="mr-5 rounded"
                                />
                                <div>
                                    <p>{item.product.title} - {getNameAttributes(item.variant.attributes)}</p>
                                    <p>
                                        {currencyFormat(item.price)} x {item.quantity}
                                    </p>
                                    <p className="font-bold">
                                        Subtotal: {currencyFormat(item.price * item.quantity)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Checkout */}
                    <div className="bg-white rounded-xl shadow-xl p-7">
                        <h2 className="text-2xl mb-2">
                            {orderData.order?.deliveryMethod === 'pickup' ? 'Datos de facturación' : 'Dirección de entrega'}
                        </h2>
                        {/* Información del método de entrega */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="font-semibold">
                                {orderData.order?.deliveryMethod === 'pickup' ? '🏠 Retiro en local' : '🚚 Envío a domicilio'}
                            </p>
                            {orderData.order?.deliveryMethod === 'pickup' && (
                                <p className="text-sm text-gray-600">
                                    Retirar en: {companyData?.legalAddress}
                                </p>
                            )}
                        </div>
                        <div className="mb-10">
                            <p className="text-xl">
                                {orderData.order?.OrderAddress?.firstName}{" "}
                                {orderData.order?.OrderAddress?.lastName}
                            </p>
                            <p>{orderData.order?.OrderAddress?.address}</p>
                            <p>{orderData.order?.OrderAddress?.address2}</p>
                            <p>{orderData.order?.OrderAddress?.postalCode}</p>
                            <p>
                                {orderData.order?.OrderAddress?.city},{" "}
                                {orderData.order?.OrderAddress?.country?.name}
                            </p>
                            <p>{orderData.order?.OrderAddress?.phone}</p>
                        </div>

                        <div className="w-full h-0.5 rounded bg-gray-200 mb-10"></div>

                        <h2 className="text-2xl mb-2">Resumen del pedido</h2>
                        <div className="grid grid-cols-2">
                            <span>No. Productos</span>
                            <span className="text-right">
                                {orderData.order?.itemsInOrder === 1
                                    ? "1 articulo"
                                    : `${orderData.order?.itemsInOrder} articulos`}
                            </span>

                            <span>Sutotal</span>
                            <span className="text-right">
                                {currencyFormat(orderData.order?.subTotal || 0)}
                            </span>

                            {/* <span>Impuestos (21%)</span>
                            <span className="text-right">
                                {currencyFormat(orderData.order?.tax || 0)}
                            </span> */}

                            {
                                orderData.order?.discounts && orderData.order?.discounts > 0 && (
                                    <>
                                        <span>Descuentos</span>
                                        <span className="text-right">-{currencyFormat(orderData.order?.discounts)}</span>
                                    </>
                                )
                            }
                            {/* Información de envío */}
                            {
                                orderData.order?.deliveryMethod === 'pickup' ? (
                                    <>
                                        <span>Retiro en local</span>
                                        <span className="text-right text-green-600 font-semibold">¡GRATIS!</span>
                                    </>
                                ) : (
                                    orderData.order?.freeShipping ? (
                                        <>
                                            <span>Envío a domicilio</span>
                                            <span className="text-right text-green-600 font-semibold">¡GRATIS!</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Envío a domicilio</span>
                                            <span className="text-right">{currencyFormat(orderData.order?.shippingCost || 0)}</span>
                                        </>
                                    )
                                )
                            }

                            <span className="text-2xl mt-5">Total:</span>
                            <span className="text-2xl mt-5 text-right">
                                {currencyFormat(orderData.order?.total || 0)}
                            </span>
                        </div>

                        <div className="flex gap-4 mb-2 mt-4">
                            {orderData.order?.id && (
                                <ConfirmOrderActions orderId={orderData.order.id} isPaid={orderData.order.isPaid} status={orderData.order.paymentStatus} />
                            )}
                        </div>

                            {
                                (orderData.order?.isPaid === true && orderData.order.paymentStatus === 'paid' )? (
                                    <div className="mt-5 mb-2 w-full">
                                        <OrderStatus
                                            status={"Pagada"}
                                            Icon={IoWalletOutline}
                                            colorClass="bg-green-700" 
                                        />
                                    </div>
                                ) : (
                                <>
                                    {/* <MercadoPagoButton 
                                        text="Pagar"
                                        orderId={orderData.order!.id}
                                        amount={orderData.order!.total}
                                        descriptionMP={descriptionMP}
                                    /> */}
                                    {/* <PayPalButton 
                                        orderId={orderData.order!.id}
                                        amount={orderData.order!.total}
                                    /> */}
                                </>
                                )
                            }
                    </div>
                </div>
            </div>
        </div>
    );
}

