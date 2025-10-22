"use client";

import {
    AttributeWithValues,
    Category,
    Product,
    ProductImage
} from "@/interfaces";
import { useState, useEffect, useRef } from "react";
import { CategoryCheckboxTree } from "./CategoryCheckboxTree";
import { useForm } from "react-hook-form";
import { ProductImage as ProductImageCmp } from "@/components";
import { IoCloseOutline } from "react-icons/io5";
import { saveOrUpdateProduct } from "@/actions";
import { Toaster, toast } from 'sonner';
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal/Modal"; // Asume que tienes un componente Modal reutilizable

interface Props {
    product: Partial<Product> & { ProductImage?: ProductImage[] };
    categories: Category[];
    attributes: AttributeWithValues[];
}

interface FormInputs {
    title: string;
    slug: string;
    description: string;
    tags: string;
    diffPrice: boolean;
    ProductImage?: ProductImage[];
    isEnabled: boolean;
}

export const ProductForm = ({
    product,
    categories = [],
    attributes = [],
}: Props) => {
    const router = useRouter()
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
        []
    );

    // Estado para variantes
    const [variants, setVariants] = useState<
        Array<{
            id: string;
            price: string;
            stock: string;
            sku: string;
            attributes: Array<{ id?: string; attributeId: string; value: string; valueId: string }>;
            discountPercent: string;
            order: number;
        }>
    >([]);
    

    const [slug, setSlug] = useState<string>(product?.slug || "");
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setValue("title", value);
        if (!slugManuallyEdited) {
            setSlug(generateSlug(value));
            setValue("slug", generateSlug(value));
        }
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSlug(value);
        setSlugManuallyEdited(true);
        setValue("slug", value);
    };

    const validateSlug = (slug: string) => {
        // Must be non-empty, only lowercase letters, numbers, and hyphens
        return /^[a-z0-9-]+$/.test(slug) && slug.length > 0;
    };

    const [slugError, setSlugError] = useState<string>("");

    const handleSlugBlur = () => {
        if (!validateSlug(slug)) {
            setSlugError("Slug must contain only lowercase letters, numbers, and hyphens.");
        } else {
            setSlugError("");
        }
    };

    // Slug generator without lodash
    const deburr = (str: string) => {
        // Remove accents/diacritics
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const generateSlug = (title: string) => {
        let slug = deburr(title)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-') // espacios medios por -
            .replace(/[^a-z0-9-]/g, ''); // solo letras, números y guiones
        return slug;
    };

    useEffect(() => {
        if (product?.variants && product.variants.length > 0) {
            setVariants(
                product.variants.map(variant => ({
                    id: variant.id,
                    price: variant.price.toString(),
                    stock: variant.stock.toString(),
                    sku: variant.sku || "",
                    discountPercent: variant.discountPercent?.toString() || "",
                    order: variant.order || 0,
                    attributes: (variant.attributes || []).map(attr => ({
                        id: attr.id ?? '', // Use attr.id if available, fallback to empty string
                        attributeId: attr.attributeId,
                        valueId: attr.valueId,
                        value: typeof attr.value === "object" && attr.value !== null
                            ? String(attr.value.value)
                            : String(attr.value)
                    }))
                }))
            );
            // Setear atributos seleccionados según la primera variante
            const firstVariantAttrs = product.variants[0].attributes?.map(attr => attr.attributeId) || [];
            const categoriesSelected = product.categories?.map(cat => cat.categoryId) || [];
            setSelectedAttributeIds(firstVariantAttrs);
            setSelectedCategoryIds(categoriesSelected);
        }
    }, [product]);

    // Estado para atributos seleccionados
    const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>(
        []
    );

    const {
        handleSubmit,
        register,
        formState: { isValid },
        getValues,
        setValue,
    } = useForm<FormInputs>({
        defaultValues: {
            ...product,
            tags: product?.tags?.join(", ") || "",
            diffPrice: product?.diffPrice || false,
        }
    })

    // Estado para imágenes nuevas y existentes
    const [newImages, setNewImages] = useState<File[]>([]);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Actualizar imágenes nuevas
    const handleNewImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewImages(Array.from(e.target.files));
        }
    };

    // Eliminar imagen existente (marcar para borrar)
    const handleRemoveImage = (imageId: string) => {
        setImagesToDelete(prev => [...prev, imageId]);
    };

    // Eliminar imagen nueva (remover del estado)
    const handleRemoveNewImage = (idx: number) => {
        const updatedImages = newImages.filter((_, i) => i !== idx);
        setNewImages(updatedImages);
        // Actualizar el input file para reflejar el nuevo estado
        if (fileInputRef.current) {
            // Crear un nuevo DataTransfer para los archivos restantes
            const dt = new DataTransfer();
            updatedImages.forEach(file => dt.items.add(file));
            fileInputRef.current.files = dt.files;
        }
    };

    // Validar que todos los variantes tengan los mismos tipos de atributos
    const validateVariantAttributes = () => {
        if (variants.length === 0) return true;
        const baseAttrIds = variants[0].attributes.map(a => a.attributeId).sort().join(',');
        return variants.every(v => v.attributes.map(a => a.attributeId).sort().join(',') === baseAttrIds);
    };

    // Campos para nueva variante
    const [newVariant, setNewVariant] = useState({
        price: "",
        stock: "",
        sku: "",
        attributes: attributes.map((attr) => ({
            id: "",
            attributeId: attr.id,
            value: "",
        })),
        discountPercent: "",
        order: 0,
    });

    // Actualizar valor de atributo en nueva variante
    const handleAttributeValueChange = (attributeId: string, value: string) => {
        
        setNewVariant((prev) => ({
            ...prev,
            attributes: prev.attributes.map((attr) =>
                attr.attributeId === attributeId ? { ...attr, value } : attr
            ),
        }));
    };

    // Manejar selección de atributos
    const handleAttributeCheckbox = (attributeId: string, checked: boolean) => {
        setSelectedAttributeIds((prev) =>
            checked
                ? [...prev, attributeId]
                : prev.filter((id) => id !== attributeId)
        );
        // Reiniciar los valores de atributos en el formulario de variante
        setNewVariant((prev) => ({
            ...prev,
            attributes: attributes
                .filter((attr) =>
                    checked
                        ? [
                              ...prev.attributes.map((a) => a.attributeId),
                              attributeId,
                          ].includes(attr.id)
                        : prev.attributes
                              .map((a) => a.attributeId)
                              .filter((id) => id !== attributeId)
                              .includes(attr.id)
                )
                .map((attr) => ({ id: attr.id ,attributeId: attr.id, value: "" })),
        }));
    };

    const [variantModalOpen, setVariantModalOpen] = useState(false);
    const [editVariantIndex, setEditVariantIndex] = useState<number | null>(null);

    const openAddVariantModal = () => {
        setEditVariantIndex(null);
        setVariantModalOpen(true);
    };
    const openEditVariantModal = (idx: number) => {
        setEditVariantIndex(idx);
        // Cargar datos de la variante a editar
        const v = variants[idx];
        
        setNewVariant({
            price: v.price,
            stock: v.stock,
            sku: v.sku,
            discountPercent: v.discountPercent,
            order: v.order || 0,
            attributes: attributes.map(attr => {
                const found = v.attributes.find(a => a.attributeId === attr.id);
                return {
                    id: found ? found.id || "" : "",
                    attributeId: found ? found?.attributeId : "",
                    value: found ? found.value : "",
                };
            }),
        });
        setVariantModalOpen(true);
    };
    const closeVariantModal = () => {
        setVariantModalOpen(false);
        setNewVariant({
            price: "",
            stock: "",
            sku: "",
            attributes: attributes.map((attr) => ({
                id: "",
                attributeId: "",
                value: "",
            })),
            discountPercent: "",
            order: 0,
        });
    };

    const handleSaveVariant = () => {
        // Validación igual que antes
        if (selectedAttributeIds.length === 0) {
            alert("Debes seleccionar al menos un atributo para la variante.");
            return;
        }
        const allFilled = selectedAttributeIds.every(attrId => {
            const attr = newVariant.attributes.find(a => a.attributeId === attrId);
            return attr && attr.value.trim() !== "";
        });
        if (!allFilled) {
            alert("Completa todos los atributos seleccionados para la variante");
            return;
        }

        
        const variantData = {
            id: editVariantIndex !== null ? variants[editVariantIndex].id : Math.random().toString(36).slice(2),
            price: newVariant.price,
            stock: newVariant.stock,
            sku: newVariant.sku,
            discountPercent: newVariant.discountPercent,
            order: newVariant.order,
            attributes: newVariant.attributes
                .filter(attr => selectedAttributeIds.includes(attr.attributeId))
                .map(attr => ({
                    id: attr.id,
                    attributeId: attr.attributeId,
                    value: attr.value,
                    valueId: (attributes.find(a => a.id === attr.attributeId)?.values?.find(v => v.value === attr.value)?.id) || "",
                })),
        };
        
        if (editVariantIndex !== null) {
            setVariants(prev => prev.map((v, idx) => idx === editVariantIndex ? variantData : v));
        } else {
            setVariants(prev => [...prev, variantData]);
        }
        closeVariantModal();
    };

    // Eliminar variante
    const handleRemoveVariant = (id: string) => {
        setVariants((prev) => prev.filter((v) => v.id !== id));
    };

    const handleCategoryChange = (id: string, checked: boolean) => {
        setSelectedCategoryIds((prev) => {
            if (checked) {
                return [...prev, id];
            } else {
                return prev.filter((catId) => catId !== id);
            }
        });
    };

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const validateProductForm = () => {
        let valid = true;
        let errors: Record<string, string> = {};
        const titleValue = getValues("title");
        if (!titleValue || !titleValue.trim()) {
            errors.title = "Title is required.";
            valid = false;
        }
        if (!validateSlug(slug)) {
            errors.slug = "Slug must contain only lowercase letters, numbers, and hyphens.";
            valid = false;
        }
        if (!selectedCategoryIds.length) {
            errors.categories = "At least one category must be selected.";
            valid = false;
        }
        if (!variants.length) {
            errors.variants = "Al menos una variante es requerida.";
            valid = false;
        }
        // Validate attributes consistency across variants
        if (variants.length > 1) {
            const firstAttrs = variants[0].attributes.map(a => a.attributeId).sort();
            for (let v of variants) {
                const attrs = v.attributes.map(a => a.attributeId).sort();
                if (JSON.stringify(attrs) !== JSON.stringify(firstAttrs)) {
                    errors.variants = "All variants must have the same attribute types.";
                    valid = false;
                    break;
                }
            }
        }
        // Validate images (new + existing, minus deleted)
        const existingImages = (product?.ProductImage || []).filter(img => !imagesToDelete.includes(img.id));
        const totalImages = existingImages.length + newImages.length;
        //para validar las imagenes cargadas
        // if (totalImages === 0) {
        //     errors.images = "Al menos 1 imágen es requerida.";
        //     valid = false;
        // }
        setFormErrors(errors);
        return valid;
    };

    const handleSubmitForm = async (data: FormInputs) => {
        if(!isValid) return;
        if (!validateProductForm()) return;
        if (!validateVariantAttributes()) {
            alert('Todos los variantes deben tener los mismos tipos de atributos.');
            return;
        }
        // Limpiar ids autogenerados de variantes nuevas antes de enviar al backend
        const cleanVariants = variants.map(variant => {
            // Si el id no es un UUID (por ejemplo, menos de 20 caracteres), lo eliminamos
            
            if (!variant.id || variant.id.length < 20) {
                const { id, ...rest } = variant;
                return rest;
            }
            return variant;
        });

        // Construir FormData
        const formData = new FormData();
        if(product?.id) {
            formData.append('id', product.id);
        }
        formData.append('title', data.title);
        formData.append('slug', data.slug);
        formData.append('description', data.description);
        formData.append('tags', data.tags);
        formData.append('diffPrice', String(data.diffPrice));
        formData.append('isEnabled', String(data.isEnabled));
        selectedCategoryIds.forEach(cat => formData.append('categories[]', cat));

        formData.append('variants', JSON.stringify(cleanVariants));
        // Imágenes nuevas
        newImages.forEach(file => formData.append('newImages', file));
        // Solo IDs de imágenes a borrar
        imagesToDelete.forEach(id => formData.append('imagesToDelete[]', id));

        
        // Enviar a server action o API
        const {ok, product:updatedProduct, imageError} = await saveOrUpdateProduct(formData);
        // Manejar respuesta, mostrar notificación, etc.
        if(!ok){
            toast.error(`Error al guardar el producto`);
            return;
        }
        if(product?.id){
            toast.success("Producto actualizado con éxito")
            if(updatedProduct?.slug && updatedProduct?.slug !== product.slug){
                router.push(`/admin/product/${updatedProduct?.slug}`)
            }
        }else{
            toast.success("Producto creado con éxito")
        }
        if(imageError !== null){
            toast.error(imageError)
        }
        // Opcional: redirigir o limpiar formulario

    }

    return (
        <form onSubmit={handleSubmit(handleSubmitForm)} className="grid px-5 mb-16 grid-cols-1 sm:px-0 sm:grid-cols-2 gap-3">
            {/* Textos */}
            <div className="w-full">
                <div className="flex flex-col mb-2">
                    <span className="text-lg">Título</span>
                    <input
                        type="text"
                        className="p-2 border rounded-md bg-gray-200"
                        {...register("title", { required: true })}
                        onChange={handleTitleChange}
                    />
                    {formErrors.title && <span className="text-red-500 text-xs">{formErrors.title}</span>}
                </div>

                <div className="flex flex-col mb-2">
                    <span className="text-lg">Slug</span>
                    <input
                        type="text"
                        className="p-2 border rounded-md bg-gray-200"
                        value={slug}
                        onChange={handleSlugChange}
                        onBlur={handleSlugBlur}
                    />
                    {formErrors.slug && <span className="text-red-500 text-xs">{formErrors.slug}</span>}
                    <span className="text-xs text-gray-500">Identificador URL. Autogenerada basada en el titulo, se puede editar manualmente.</span>
                </div>

                <div className="flex flex-col mb-2">
                    <span className="text-lg">Descripción</span>
                    <textarea
                        rows={5}
                        className="p-2 border rounded-md bg-gray-200"
                        {...register("description", { required: true })}
                    ></textarea>
                </div>

                <div className="flex flex-col mb-2">
                    <span className="text-lg">Habilitar producto</span>
                    <div className="inline-flex items-center mb-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                {...register("isEnabled")}
                            />
                            <span>{`Producto habilitado?`}</span>
                        </label>
                    </div>
                </div>

                <div className="flex flex-col mb-2">
                    <span className="text-lg">Tags</span>
                    <input
                        type="text"
                        className="p-2 border rounded-md bg-gray-200"
                        {...register("tags")}
                    />
                </div>

                <div className="flex flex-col mb-2">
                    <span className="text-lg">Categorías</span>
                    <CategoryCheckboxTree
                        categories={categories}
                        selectedIds={selectedCategoryIds}
                        onChange={handleCategoryChange}
                    />
                    {formErrors.categories && <span className="text-red-500 text-xs">{formErrors.categories}</span>}
                </div>

                
            </div>

            {/* Selector de tallas y fotos */}
            <div className="w-full">
                {/* As checkboxes */}
                <div className="flex flex-col">
                    {/* Fotos */}
                    <div className="flex flex-col mb-2">
                        <span className="text-lg">Imágenes</span>
                        <input
                            type="file"
                            multiple
                            className="p-2 border rounded-md bg-gray-200"
                            accept="image/png, image/jpeg, image/jpg, image/avif"
                            onChange={handleNewImagesChange}
                            ref={fileInputRef}
                        />
                        {formErrors.images && <span className="text-red-500 text-xs">{formErrors.images}</span>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Imágenes existentes */}
                        {product?.ProductImage?.filter(img => !imagesToDelete.includes(img.id)).map(image => (
                            <div key={image.id} className="relative">
                                <ProductImageCmp 
                                    src={image.url}
                                    alt="alt"
                                    width={300}
                                    height={300}
                                />
                                <button
                                    type="button"
                                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 shadow-lg hover:bg-red-800 transition"
                                    onClick={() => handleRemoveImage(image.id)}
                                    aria-label="Eliminar imagen"
                                >
                                    <IoCloseOutline />
                                </button>
                            </div>
                        ))}
                        {/* Imágenes nuevas (preview) */}
                        {newImages.map((file, idx) => {
                            const url = URL.createObjectURL(file);
                            return (
                                <div key={idx} className="relative">
                                    <ProductImageCmp 
                                        src={url}
                                        alt="preview"
                                        width={300}
                                        height={300}
                                        className="rounded object-cover"
                                    />
                                    <button
                                        type="button"
                                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 shadow-lg hover:bg-red-800 transition"
                                        onClick={() => handleRemoveNewImage(idx)}
                                        aria-label="Eliminar imagen nueva"
                                    >
                                        <IoCloseOutline />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex flex-col mb-2">
                        <span className="text-lg">Variantes</span>
                        <div className="inline-flex items-center mb-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    {...register("diffPrice")}
                                />
                                <span>{`Variantes con diferente precio?`}</span>
                            </label>
                        </div>
                        {/* Paso 1: Selección de atributos */}
                        <div className="flex flex-col mb-4">
                            <span className="mb-2">
                                Atributos para variantes
                            </span>

                            <div className="flex flex-wrap gap-4">
                                {attributes.map((attr) => (
                                    <label
                                        key={attr.id}
                                        className="flex items-center gap-2"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedAttributeIds.includes(
                                                attr.id
                                            )}
                                            onChange={(e) =>
                                                handleAttributeCheckbox(
                                                    attr.id,
                                                    e.target.checked
                                                )
                                            }
                                        />
                                        <span>{attr.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        {/* Tabla de variantes */}
                        <table className="w-full text-sm border mb-2">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-2">Precio</th>
                                    <th className="p-2">Stock</th>
                                    <th className="p-2">SKU</th>
                                    <th className="p-2">Atributos</th>
                                    <th className="p-2">Descuento (%)</th>
                                    <th className="p-2">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {variants.map((variant, idx) => (
                                    <tr key={variant.id} className="border-b">
                                        <td className="p-2">{variant.price}</td>
                                        <td className="p-2">{variant.stock}</td>
                                        <td className="p-2">{variant.sku}</td>
                                        <td className="p-2">
                                            {variant.attributes.map((attr) => {
                                                const attrObj = attributes.find(
                                                    (a) =>
                                                        a.id ===
                                                        attr.attributeId
                                                );
                                                return (
                                                    <div key={attr.attributeId}>
                                                        <strong>
                                                            {attrObj?.name}:
                                                        </strong>{" "}
                                                        {attr.value}
                                                    </div>
                                                );
                                            })}
                                        </td>
                                        <td className="p-2">
                                            {variant.discountPercent}
                                        </td>
                                        <td className="p-2">
                                            <button
                                                type="button"
                                                className="text-blue-600 underline mr-2"
                                                onClick={() => openEditVariantModal(idx)}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                className="text-red-600 underline"
                                                onClick={() => handleRemoveVariant(variant.id)}
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {formErrors.variants && <span className="text-red-500 text-xs">{formErrors.variants}</span>}
                        {/* Formulario para nueva variante */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={openAddVariantModal}
                            >
                                Agregar variante
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <button className="btn-primary w-full">Guardar</button>
            <Toaster
                    position="bottom-right"
                />
            {/* Modal para agregar/editar variante */}
            <Modal open={variantModalOpen} onClose={closeVariantModal} title={editVariantIndex !== null ? "Editar variante" : "Agregar variante"}>
                <div className="flex flex-wrap gap-2 mb-2">
                    <div className="flex flex-col w-full">
                        <label className="text-xs font-semibold mb-1">SKU</label>
                        <input
                            type="text"
                            placeholder="SKU"
                            className="p-2 border rounded-md w-full"
                            value={newVariant.sku}
                            onChange={(e) => setNewVariant((v) => ({ ...v, sku: e.target.value }))}
                        />
                    </div>
                    <div className="flex flex-col w-full">
                        <label className="text-xs font-semibold mb-1">Precio</label>
                        <input
                            type="number"
                            placeholder="Precio"
                            className="p-2 border rounded-md w-full"
                            value={newVariant.price}
                            onChange={(e) => setNewVariant((v) => ({ ...v, price: e.target.value }))}
                        />
                    </div>
                    <div className="flex flex-col w-full">
                        <label className="text-xs font-semibold mb-1">Stock</label>
                        <input
                            type="number"
                            placeholder="Stock"
                            className="p-2 border rounded-md w-full"
                            value={newVariant.stock}
                            onChange={(e) => setNewVariant((v) => ({ ...v, stock: e.target.value }))}
                        />
                    </div>
                    
                    {/* Campos dinámicos para atributos en variante */}
                    {attributes
                        .filter((attr) => selectedAttributeIds.includes(attr.id))
                        .map((attr) => (
                            <div key={attr.id} className="flex flex-col w-32">
                                <label className="text-xs font-semibold mb-1">{attr.name}</label>
                                <select
                                    className="p-2 border rounded-md"
                                    value={newVariant.attributes.find((a) => a.attributeId === attr.id)?.value || ""}
                                    onChange={(e) => handleAttributeValueChange(attr.id, e.target.value)}
                                >
                                    <option value="">[Seleccione]</option>
                                    {(attr.values ?? []).map((val: any) => (
                                        <option key={val.id} value={val.value}>{val.value}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    <div className="flex flex-col w-full">
                        <label className="text-xs font-semibold mb-1">Descuento %</label>
                        <input
                            type="number"
                            placeholder="Descuento %"
                            className="p-2 border rounded-md w-full"
                            value={newVariant.discountPercent}
                            onChange={(e) => setNewVariant((v) => ({ ...v, discountPercent: e.target.value }))}
                        />
                    </div>
                    <div className="flex flex-col w-full">
                        <label className="text-xs font-semibold mb-1">Orden</label>
                        <input
                            type="number"
                            placeholder="Orden"
                            className="p-2 border rounded-md w-full"
                            min={0}
                            value={newVariant.order}
                            onChange={(e) => setNewVariant((v) => ({ ...v, order: Number(e.target.value) }))}
                        />
                    </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                    <button type="button" className="btn-secondary" onClick={closeVariantModal}>Cancelar</button>
                    <button type="button" className="btn-primary" onClick={handleSaveVariant}>Guardar</button>
                </div>
            </Modal>
        </form>
    );
};
