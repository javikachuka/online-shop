// https://tailwindcomponents.com/component/hoverable-table
// Agregar a todas las páginas de admin que usen headers
export const dynamic = 'force-dynamic';
// O alternativamente:
export const revalidate = 0;
import { getPaginatedProducts } from "@/actions/product/get-paginated-products";
import { Pagination, ProductImage, Title } from "@/components";

import Link from "next/link";
import { redirect } from "next/navigation";

interface Props {
    searchParams: {
        page?: string;
    };
}

export default async function OrdersPage({ searchParams }: Props) {
    // Aquí podrías obtener las órdenes del usuario
    const page = searchParams.page ? parseInt(searchParams.page) : 1;

    const { products, totalPages, ok } = await getPaginatedProducts(page);

    

    if (!ok) {
      redirect("/auth/login");
    }

    return (
        <>
            <Title title="Mantenimiento de Productos" />

            <div className="flex justify-end mb-5">
                <Link href={'/admin/product/new'} className="btn-primary">
                    Nuevo Producto
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
                                    Imagen
                                </th>
                                <th
                                    scope="col"
                                    className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                                >
                                    Titulo
                                </th>
                                <th
                                    scope="col"
                                    className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                                >
                                    Categoria Padre
                                </th>
                                <th
                                    scope="col"
                                    className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                                >
                                    Variantes
                                </th>
                                <th
                                    scope="col"
                                    className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                                >
                                    Habilitado
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
                            {products?.length === 0 && (
                                <tr className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
                                    <td
                                        colSpan={4}
                                        className="px-6 py-4 text-sm font-medium text-gray-900 text-center"
                                    >
                                        No hay productos disponibles
                                    </td>
                                </tr>
                            )}
                            {products?.map((product) => (
                                <tr
                                    key={product.id}
                                    className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100"
                                > 
                                    <td className="px-6 py-4 whitespace-nowrap">

                                            <Link href={`/product/${product.slug}`}>
                                                <ProductImage
                                                    src={product.ProductImage[0]?.url}
                                                    alt={product.title}
                                                    width={64}
                                                    height={64}
                                                    className="w-16 h-16 object-cover rounded"
                                                />
                                            </Link>
                                    </td>  
                                    <td>
                                        <Link
                                            href={`/admin/product/${product.slug}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {product.title}
                                        </Link>
                                    </td>                                 
                                <td className="text-center">
                                    {product.categories && product.categories.length > 0 ? (
                                        product.categories
                                            .filter((cat: any) => !cat.category.parentId)
                                            .map((parent: any) => (
                                                <div key={parent.category.id} className="text-sm text-gray-700">
                                                    {parent.category.name}
                                                </div>
                                            ))
                                    ) : (
                                        <span className="text-sm text-gray-400">Sin categoría</span>
                                    )}
                                </td>
                                    <td>
                                        {product.variants.map((variant) => (
                                            <div key={variant.id} className="text-sm text-gray-600">
                                                SKU: {variant.sku} - Precio: ${variant.price} - Stock: {variant.stock}
                                            </div>
                                        ))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {
                                            product.isEnabled ? (
                                                <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                                            ) : (
                                                <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                                            )
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link
                                            href={`/admin/product/${product.slug}`}
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
