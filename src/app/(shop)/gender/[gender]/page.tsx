export const revalidate = 60; //60 seg

import { getPaginatedProductsWithImages } from "@/actions";
import { Pagination, ProductGrid, Title } from "@/components";
import { initialData } from "@/seed/seed";



interface Props {
  params: {
    gender: string
  },
  searchParams: {
    page?: string
  }
}


const seedProducts = initialData.products



export default async function CategoryPage({params, searchParams}: Props) {
  const {gender} = params

  const page = searchParams.page ? parseInt(searchParams.page) : 1
  

  const {products, currentPage, totalPages} = await getPaginatedProductsWithImages({page, gender}) 

  const labels: Record<string, string> = {
    'men': 'para hombres',
    'women': 'para mujeres',
    'kid': 'para niños',
    'unisex': 'para todos',
  }
  // if(id === 'kids'){
  //   notFound()
  // }

  return (
    <>
      <Title
        title={`Artículos de ${labels[gender]}`}
        subtitle={gender}
        className="mb-2"
      />
      <ProductGrid
        products={products}
      />
      <Pagination totalPages={totalPages} />
    </>
  );
}