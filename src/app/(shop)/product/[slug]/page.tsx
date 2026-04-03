export const revalidate = 604800 // son 7 dias

import { ProductDetailContent } from "@/components/product/ProductDetailContent";
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
  
  const filters = getAvailableFilters(product.variants || []);  

  return (
    <ProductDetailContent product={product} filters={filters} />
  );
}