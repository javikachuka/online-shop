// https://tailwindcomponents.com/component/hoverable-table
// Agregar a todas las páginas de admin que usen headers
export const dynamic = 'force-dynamic';
// O alternativamente:
export const revalidate = 0;
import { getOrdersByUser, getPaginatedOrders } from "@/actions";
import { Pagination, Title } from "@/components";

import Link from "next/link";
import { redirect } from "next/navigation";
import { IoBanOutline, IoCardOutline, IoCheckmarkCircleOutline, IoTimeOutline, IoCloseCircleOutline } from "react-icons/io5";

interface Props {
    searchParams: {
        page?: string;
    };
}

export default async function OrdersPage({ searchParams }: Props) {
    // Aquí podrías obtener las órdenes del usuario
    const page = searchParams.page ? parseInt(searchParams.page) : 1;

    const { orders, totalPages, ok } = await getPaginatedOrders(page);

    if (!ok) {
      redirect("/auth/login");
    }

    return (
        <>
            <Title title="Todos los pedidos" />

            <div className="mb-10">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-200 border-b">
                            <tr>
                                <th
                                    scope="col"
                                    className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                                >
                                    #ID
                                </th>
                                <th
                                    scope="col"
                                    className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                                >
                                    Nombre completo
                                </th>
                                <th
                                    scope="col"
                                    className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                                >
                                    Estado
                                </th>
                                <th
                                    scope="col"
                                    className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                                >
                                    Fecha
                                </th>
                                <th
                                    scope="col"
                                    className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                                >
                                    Opciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders?.length === 0 && (
                                <tr className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
                                    <td
                                        colSpan={4}
                                        className="px-6 py-4 text-sm font-medium text-gray-900 text-center"
                                    >
                                        No hay pedidos disponibles
                                    </td>
                                </tr>
                            )}
                            {orders?.map((order) => (
                                <tr
                                    key={order.id}
                                    className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="hover:underline"
                                        >
                                        {order.id.split("-").at(-1)}
                                        </Link>
                                    </td>
                                    <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        {order.OrderAddress?.firstName}{" "}
                                        {order.OrderAddress?.lastName}
                                    </td>
                                    <td className="flex items-center text-sm  text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                        {order.orderStatus === 'delivered' ? (
                                            <>
                                                <IoCheckmarkCircleOutline className="text-blue-800" />
                                                <span className="mx-2 text-blue-800">
                                                    Entregado
                                                </span>
                                            </>
                                        ) : order.orderStatus === 'paid' || (order.isPaid && order.paymentStatus === 'paid') ? (
                                            <>
                                                <IoCardOutline className="text-green-800" />
                                                <span className="mx-2 text-green-800">
                                                    Pagado
                                                </span>
                                            </>
                                        ) : order.orderStatus === 'cancelled' || order.paymentStatus === 'cancelled' ? (
                                            <>
                                                <IoBanOutline className="text-red-800" />
                                                <span className="mx-2 text-red-800">
                                                    Cancelado
                                                </span>
                                            </>
                                        ) : order.orderStatus === 'expired' ? (
                                            <>
                                                <IoCloseCircleOutline className="text-orange-800" />
                                                <span className="mx-2 text-orange-800">
                                                    Expirado
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <IoTimeOutline className="text-yellow-800" />
                                                <span className="mx-2 text-yellow-800">
                                                    Pendiente de pago
                                                </span>
                                            </>
                                        )}
                                    </td>
                                    <td className="text-sm text-gray-900 font-light px-6 ">
                                        {new Date(order.createdAt).toLocaleString()}
                                    </td>
                                    <td className="text-sm text-gray-900 font-light px-6 ">
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="hover:underline"
                                        >
                                            Ver pedido
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalPages && totalPages > 1 && (
                    <Pagination totalPages={totalPages}/>
                )}
            </div>
        </>
    );
}
