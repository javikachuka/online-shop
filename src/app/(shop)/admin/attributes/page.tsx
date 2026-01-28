// https://tailwindcomponents.com/component/hoverable-table
// Agregar a todas las páginas de admin que usen headers
export const dynamic = 'force-dynamic';
// O alternativamente:
export const revalidate = 0;

import { Pagination, Title } from "@/components";

import Link from "next/link";
import { redirect } from "next/navigation";
import { IoCardOutline } from "react-icons/io5";
import Image from "next/image";
import { getPaginatedAttributes } from "@/actions";

interface Props {
    searchParams: {
        page?: string;
    };
}

export default async function AttributesPage({ searchParams }: Props) {
    // Aquí podrías obtener las órdenes del usuario
    const page = searchParams.page ? parseInt(searchParams.page) : 1;

    const { attributes, totalPages, ok } = await getPaginatedAttributes(page);

    

    if (!ok) {
      redirect("/auth/login");
    }

    return (
        <>
            <Title title="Mantenimiento de atributos de producto" />

            <div className="flex justify-end mb-5">
                <Link href={'/admin/attributes/new'} className="btn-primary">
                    Nuevo Atributo
                </Link>
            </div>

            <div className="mb-10">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-200 border-b">
                            <tr>
                                <th
                                    scope="col"
                                    className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                                >
                                    Nombre
                                </th>
                                <th
                                    scope="col"
                                    className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                                >
                                    Valores
                                </th>
                                <th
                                    scope="col"
                                    className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                                >
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {attributes?.length === 0 && (
                                <tr className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
                                    <td
                                        colSpan={4}
                                        className="px-6 py-4 text-sm font-medium text-gray-900 text-center"
                                    >
                                        No hay productos disponibles
                                    </td>
                                </tr>
                            )}
                            {attributes?.map((attribute) => (
                                <tr
                                    key={attribute.id}
                                    className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100"
                                > 
                                    <td>
                                        <Link
                                            href={`/admin/attributes/${attribute.id}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {attribute.name}
                                        </Link>
                                    </td>                                 
                                    <td>
                                        {attribute.values.map((value) => (
                                            <div key={value.id} className="text-sm text-gray-600">
                                                {value.value}
                                            </div>
                                        ))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link
                                            href={`/admin/attributes/${attribute.id}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            Editar
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
