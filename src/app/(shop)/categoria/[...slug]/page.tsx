export const revalidate = 604800 // 7 días

import { getProductsByCategorySlug } from '@/actions';
import { getCategoryBySlugPath } from '@/actions/category/getCategoryBySlugPath';
import { Pagination, ProductGrid, Title } from '@/components';
import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from "next";
import { getProductsByCategoryId } from '@/actions/category/getProductsByCategoryId';

interface Props {
  params: {
    slug: string[];
  };
  searchParams: {
    page?: string;
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const slugArray = params.slug || [];
  const page = searchParams.page ? parseInt(searchParams.page) : 1;

  // Busca la categoría actual por la ruta completa
  const category = await getCategoryBySlugPath(slugArray);
  if (!category) notFound();
  
  // Obtiene los productos paginados de la categoría usando el id
  const { products, currentPage, totalPages } = await getProductsByCategoryId({ id: category.id, page });

  
  return (
    <>
      <Title
        title={category.name}
        subtitle={category.description || ''}
        className="mb-2"
      />
      <ProductGrid products={products} />
      {products.length === 0 ? (
        <div className="text-center text-gray-500 my-8">
          No existen productos en esta categoría aún.
        </div>
      ) : (
        <Pagination totalPages={totalPages} />
      )}
    </>
  );
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slugArray = params.slug || [];
  const category = await getCategoryBySlugPath(slugArray);

  if (!category) {
    return {
      title: "Categoría no encontrada",
      description: "La categoría solicitada no existe.",
    };
  }

  return {
    title: category.name,
    description: category.description || `Productos de la categoría ${category.name}`,
    openGraph: {
      title: category.name,
      description: category.description || `Productos de la categoría ${category.name}`,
      // Puedes agregar una imagen por defecto o de la categoría si la tienes
      // images: ["/imgs/categorias/default.jpg"]
    },
  };
}