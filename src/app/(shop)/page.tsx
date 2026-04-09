export const revalidate = 60; //60 seg


import { getPaginatedProductsWithImages } from "@/actions";
import { Pagination, ProductGrid, Title } from "@/components";

// const products = initialData.products

interface Props {
  searchParams: {
    page?: string
  }
}


export default async function ShopPage({searchParams} : Props) {


  const page = searchParams.page ? parseInt(searchParams.page) : 1

  const {products, totalPages} = await getPaginatedProductsWithImages({page}) 

  const hasProducts = products.length > 0;
  const emptyStateTitle = page > 1
    ? 'No encontramos más productos para mostrar'
    : 'No hay productos disponibles en este momento';
  const emptyStateMessage = page > 1
    ? 'Probá con otra búsqueda o volvé a intentarlo más tarde.'
    : 'Estamos preparando novedades para vos. Volvé pronto para ver nuestro catálogo.';

  return (
    <>
      <Title 
        title="Tienda"
        subtitle="Todos los productos"
        className="mb-2"
      />

      {hasProducts ? (
        <>
          <ProductGrid 
            products={products}
          />

          <Pagination totalPages={totalPages} />
        </>
      ) : (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-xl font-semibold text-gray-800">{emptyStateTitle}</h2>
          <p className="mt-2 text-sm text-gray-500">
            {emptyStateMessage}
          </p>
        </div>
      )}

    </>
  );
}
