import { getAllAtributes, getAllEnabledCategories, getAttributeById, getProductBySlug } from "@/actions";
import { Title } from "@/components";
import { notFound } from "next/navigation";
import { AttributesForm } from "./ui/AttributesForm";

interface Props {
    params: {
        id: string;
    };
}

export default async function ProductPage({ params }: Props) {
    const { id } = params;

    const {attribute} = await getAttributeById(id);
    

    if(!attribute && id !== 'new') {
        return notFound();
    }
    
    const title = (id === 'new') ? 'Nuevo Atributo' : 'Editar Atributo';
    return (
        <>
            <Title title={`${title}`} />
            <AttributesForm attribute={attribute!} />
        </>
    );
};
