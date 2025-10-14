export const revalidate = 604800 // son 7 dias

import { FilterAttributes, ProductSlidesShow, ProductSlidesShowMobile } from "@/components";
import { titleFont } from "@/config/fonts";
import { getProductBySlug } from "@/actions";
import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
import { ProductVariant } from "@/interfaces";

interface Props {
  params: {
    slug: string
  }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const slug = params.slug
 
  // fetch data
  const product = await getProductBySlug(slug)
 
  // optionally access and extend (rather than replace) parent metadata
  // const previousImages = (await parent).openGraph?.images || []
 
  return {
    title: product?.title || 'Producto no encontrado',
    description: product?.description || ' ',
    openGraph: {
      title: product?.title || 'Producto no encontrado',
      description: product?.description || ' ',
      images: [`/products/${product?.ProductImage[0]?.url}`],
    },
  }
}

// Función para obtener los filtros posibles
const getAvailableFilters = (variants: ProductVariant[]) => {
    const filters: { [attributeName: string]: Set<string> } = {};
    variants.forEach((variant) => {
        variant.attributes.forEach((attr) => {
            const attrName = attr.attribute.name;
            if (!filters[attrName]) {
                filters[attrName] = new Set();
            }
            filters[attrName].add(typeof attr.value === 'string' ? attr.value : attr.value.value);
        });
    });
    
    return Object.fromEntries(
        Object.entries(filters).map(([k, v]) => [k, Array.from(v)])
    );
};



export default async function ProductPage({params} : Props) {
  
  const {slug} = params

  const product = await getProductBySlug(slug)

  if (!product) {
    notFound();
  }

  console.log(product.variants);
  
  const filters = getAvailableFilters(product.variants || []);

  console.log(filters);
  


  return (
    <div className="md:mt-5 mb-20 grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Slide show */}
      <div className="col-span-1 md:col-span-2 ">
        {/* Mobile */}
        <ProductSlidesShowMobile
          title={product.title}
          images={product.ProductImage}
          className="block md:hidden"
        />

        {/* Desktop */}
        <ProductSlidesShow 
          title={product.title}
          images={product.ProductImage}
          className="hidden md:block"
        />
      </div>

      {/* details */}
      <div className="col-span-1 px-5 ">
        {/* <StockLabel slug={product.slug}/> */}
        <h1 className={`${titleFont.className} antialiased font-bold text-xl`}>
          {product.title}
        </h1>


        {/* Filtros dinámicos de atributos */}
        <FilterAttributes product={product} filters={filters}/>

        {/* description */} 
        <h3 className="font-bold text-sm">
          Descripcion
        </h3>
        <p className="font-light">{product.description}</p>
      </div>

    </div>
  );
}