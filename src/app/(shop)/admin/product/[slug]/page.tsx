import { getAllAtributes, getAllEnabledCategories, getProductBySlug } from "@/actions";
import { Title } from "@/components";
import { notFound } from "next/navigation";
import { ProductForm } from "./ui/ProductForm";

interface Props {
    params: {
        slug: string;
    };
}

export default async function ProductPage({ params }: Props) {
    const { slug } = params;

    const [product, {categories}, {attributes}] = await Promise.all([
        getProductBySlug(slug),
        getAllEnabledCategories(),
        getAllAtributes()
    ]);
    

    if(!product && slug !== 'new') {
        return notFound();
    }

    const categoriesTyped = categories as any[];
    

    const title = (slug === 'new') ? 'Nuevo Producto' : 'Editar Producto';
    return (
        <>
            <Title title={`${title}`} />
            <ProductForm product={product!} categories={categoriesTyped ?? []} attributes={attributes ?? []} />
        </>
    );
};
