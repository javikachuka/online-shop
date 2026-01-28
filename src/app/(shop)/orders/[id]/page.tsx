import { getDefaultCompany, getOrderById } from "@/actions";
import { OrderStatus, ProductImage, Title } from "@/components";
import { currencyFormat, getNameAttributes } from "@/utils";
import { getOrderProductTitles } from "@/utils/order-utils";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IoBanOutline, IoWalletOutline, IoCheckmarkCircleOutline, IoTimeOutline, IoCloseCircleOutline } from "react-icons/io5";

interface Props {
    params: {
        id: string;
    };
}

export default async function CategoryPage({ params }: Props) {
    const { id } = params;

    const orderData = await getOrderById(id);
    const companyData = await getDefaultCompany()
    
    
    if(orderData.ok === false) {
        redirect("/orders");
    }

    
    const descriptionMP = getOrderProductTitles(orderData.order?.OrderItem!)

    if (!orderData.ok) {
        return (
            <div className="flex justify-center items-center mb-72 px-10 sm:px-0">
                <div className="flex flex-col w-[1000px]">
                    <Title title="Pedido no encontrado"></Title>
                    <p className="text-red-500">
                        No se pudo encontrar el pedido.
                    </p>
                    <Link href="/orders" className="underline text-blue-500">
                        Volver a las pedidos
                    </Link>
                </div>
            </div>
        );
    }

    const orderItems = orderData.order?.OrderItem || [];

    return (
        <div className="flex justify-center items-center mb-72 px-4 sm:px-0">
            <div className="flex flex-col w-[1000px]">
                <Title title={`Pedido #${id.split("-").at(-1)}`}></Title>

                {!orderData.order?.isPaid && orderData.order?.paymentMethod?.type === "offline" && (
                    <div className="mt-4 mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 ">
                        <p className="font-bold mb-2">Datos para realizar la transferencia bancaria:</p>
                        {
                            companyData ? (
                                <ul className="mb-2 text-sm">
                                    <li>Banco: {companyData.bankName}</li>
                                    <li>CBU: {companyData.cbu}</li>
                                    <li>Alias: {companyData.alias}</li>
                                    <li>Titular: {companyData.accountHolder}</li>
                                </ul>
                            ) : (
                                <p>No se encontraron datos de la empresa.</p>
                            )
                        }
                        <p className="text-sm mb-2">El pedido será almacenado hasta <span className="font-bold">12hs</span>. Si no se acredita el pago en ese plazo, el pedido se cancelará automáticamente.</p>
                        <p className="text-sm text-yellow-900 font-semibold">Por favor, revisá que todos los datos de la transferencia sean correctos antes de enviarla y asegurate de transferir el <span className="font-bold">monto total</span> que figura al final del resumen del pedido.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-10">
                    {/* Carrito */}
                    <div className="flex flex-col">
                        {orderData.order?.orderStatus === 'delivered' ? (
                            <OrderStatus
                                status={"Entregado"}
                                Icon={IoCheckmarkCircleOutline}
                                colorClass="bg-blue-700" />
                        ) : orderData.order?.orderStatus === 'paid' || (orderData.order?.isPaid && orderData.order?.paymentStatus === 'paid') ? (
                            <OrderStatus
                                status={"Pagado"}
                                Icon={IoWalletOutline}
                                colorClass="bg-green-700" />
                        ) : orderData.order?.orderStatus === 'cancelled' || orderData.order?.paymentStatus === 'cancelled' ? (
                            <OrderStatus
                                status={"Cancelado"}
                                Icon={IoBanOutline}
                                colorClass="bg-red-500" />
                        ) : orderData.order?.orderStatus === 'expired' ? (
                            <OrderStatus
                                status={"Expirado"}
                                Icon={IoCloseCircleOutline}
                                colorClass="bg-orange-500" />
                        ) : (
                            <OrderStatus
                                status={"Pendiente de pago"}
                                Icon={IoTimeOutline}
                                colorClass="bg-yellow-500" />
                        )}

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
                                    {
                                        item.discount && item.discount > 0 ? (
                                            <div className="flex items-center space-x-2">
                                                <p className="font-bold ">
                                                    Subtotal: <span className="line-through text-gray-500">{currencyFormat((item.price * item.quantity))}</span>
                                                </p>
                                                <p className="bg-red-100 text-red-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                                                    {currencyFormat((item.price * item.quantity) - item.discount)}
                                                </p>
                                            </div>
                                        ) : 
                                        <p className="font-bold">
                                            Subtotal: {currencyFormat((item.price * item.quantity))}
                                        </p>
                                    }
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

                        <div className="mb-4">
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
                            
                            {orderData.order?.deliveryMethod === 'pickup' && (
                                <p className="text-xs text-gray-500 mt-2">
                                    * Dirección usada únicamente para facturación
                                </p>
                            )}
                        </div>

                        <div className="w-full h-0.5 rounded bg-gray-200 mb-4"></div>

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

                            {/* TODO - taxes */}
                            {/* <span>Impuestos (21%)</span>
                            <span className="text-right">
                                {currencyFormat(orderData.order?.tax || 0)}
                            </span> */}

                            <span className="text-2xl mt-5">Total:</span>
                            <span className="text-2xl mt-5 text-right">
                                {currencyFormat(orderData.order?.total || 0)}
                            </span>
                        </div>

                        <div className="mt-5 mb-2 w-full">
                            {
                                orderData.order?.orderStatus === 'delivered' ? (
                                    <OrderStatus
                                        status={"Entregado"}
                                        Icon={IoCheckmarkCircleOutline}
                                        colorClass="bg-blue-700" 
                                    />
                                ) : orderData.order?.orderStatus === 'paid' || (orderData.order?.isPaid && orderData.order?.paymentStatus === 'paid') ? (
                                    <OrderStatus
                                        status={"Pagado - Pendiente de entrega"}
                                        Icon={IoWalletOutline}
                                        colorClass="bg-green-700" 
                                    />
                                ) : orderData.order?.orderStatus === 'cancelled' || orderData.order?.paymentStatus === 'cancelled' ? (
                                    <OrderStatus
                                        status={"Cancelado"}
                                        Icon={IoBanOutline}
                                        colorClass="bg-red-500" 
                                    />
                                ) : orderData.order?.orderStatus === 'expired' ? (
                                    <OrderStatus
                                        status={"Expirado"}
                                        Icon={IoCloseCircleOutline}
                                        colorClass="bg-orange-500" 
                                    />
                                ) : null
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
