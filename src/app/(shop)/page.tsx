export const revalidate = 60; //60 seg

import type { Metadata } from 'next';
import { getPaginatedProductsWithImages } from "@/actions";
import { Pagination, ProductGrid, Title } from "@/components";

export const metadata: Metadata = {
  title: 'Accesorios para celular — Fundas, Cargadores y más',
  description:
    'Comprá accesorios para celular en iOS Pro: fundas para iPhone, cargadores, auriculares y protectores de pantalla. Envíos a todo Argentina.',
  openGraph: {
    title: 'iOS Pro — Accesorios para celular en Argentina',
    description:
      'Fundas, cargadores, auriculares y protectores de pantalla para iPhone y Samsung. Envíos a todo el país.',
    url: '/',
    type: 'website',
  },
  alternates: {
    canonical: '/',
  },
};

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
        title="Accesorios para celular"
        subtitle="Fundas, cargadores, auriculares y más"
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
