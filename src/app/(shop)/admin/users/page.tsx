// https://tailwindcomponents.com/component/hoverable-table
// Agregar a todas las páginas de admin que usen headers
export const dynamic = 'force-dynamic';
// O alternativamente:
export const revalidate = 0;
import { getOrdersByUser, getPaginatedOrders, getPaginatedUsers } from "@/actions";
import { Pagination, Title } from "@/components";

import Link from "next/link";
import { redirect } from "next/navigation";
import { IoCardOutline } from "react-icons/io5";
import { UsersTable } from "./ui/UsersTable";

interface Props {
    searchParams: {
        page?: string;
    };
}

export default async function OrdersPage({ searchParams }: Props) {
    // Aquí podrías obtener las órdenes del usuario
    const page = searchParams.page ? parseInt(searchParams.page) : 1;

    const { users, totalPages, ok } = await getPaginatedUsers(page);

    if (!ok) {
      redirect("/auth/login");
    }

    return (
        <>
            <Title title="Todos los usuarios" />

            <div className="mb-10">
                <div className="overflow-x-auto">
                    <UsersTable users={users ?? []}/>
                </div>
                {totalPages && totalPages > 1 && (
                    <Pagination totalPages={totalPages}/>
                )}
            </div>
        </>
    );
}
