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

interface ComboAttribute {
    attributeId: string;
    value: string;
}
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

        // --- NUEVOS ESTADOS SENIOR ---
    const [visualAttributeId, setVisualAttributeId] = useState<string | null>(null);
    // Agrupamos las imágenes nuevas por el valor del atributo (ej: { "Negro": [File, File], "Plata": [File] })
    const [groupedNewImages, setGroupedNewImages] = useState<Record<string, File[]>>({});

    const [selectedValuesForMatrix, setSelectedValuesForMatrix] = useState<Record<string, string[]>>({});

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

        // Manejador para cuando cambian las imágenes de un grupo específico
    const handleGroupedImagesChange = (groupValue: string, files: FileList | null) => {
        if (!files) return;
        const fileArray = Array.from(files);
        setGroupedNewImages(prev => ({
            ...prev,
            [groupValue]: [...(prev[groupValue] || []), ...fileArray]
        }));
    };

    const removeImageFromGroup = (groupValue: string, index: number) => {
        setGroupedNewImages(prev => ({
            ...prev,
            [groupValue]: prev[groupValue].filter((_, i) => i !== index)
        }));
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
        attributes: [] as Array<{ id: string; attributeId: string; value: string }>, // ← FIX: Inicializar vacío
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
        setSelectedAttributeIds((prev) => {
            const newSelected = checked
                ? [...prev, attributeId]
                : prev.filter((id) => id !== attributeId);
            
            // ← FIX: Actualizar newVariant basándose en los nuevos selectedAttributeIds
            setNewVariant((prevVariant) => ({
                ...prevVariant,
                attributes: attributes
                    .filter((attr) => newSelected.includes(attr.id))
                    .map((attr) => {
                        // Preservar el valor existente si ya estaba seleccionado
                        const existing = prevVariant.attributes.find(a => a.attributeId === attr.id);
                        return {
                            id: existing?.id || "",
                            attributeId: attr.id,
                            value: existing?.value || "",
                        };
                    }),
            }));
            
            return newSelected;
        });
    };

    const [variantModalOpen, setVariantModalOpen] = useState(false);
    const [editVariantIndex, setEditVariantIndex] = useState<number | null>(null);

    const openAddVariantModal = () => {
        setEditVariantIndex(null);
        // ← FIX: Inicializar correctamente los atributos basándose en selectedAttributeIds
        setNewVariant({
            price: "",
            stock: "",
            sku: "",
            attributes: attributes
                .filter((attr) => selectedAttributeIds.includes(attr.id))
                .map((attr) => ({
                    id: "",
                    attributeId: attr.id,
                    value: "",
                })),
            discountPercent: "",
            order: 0,
        });
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
            attributes: attributes
                .filter((attr) => selectedAttributeIds.includes(attr.id))
                .map((attr) => ({
                    id: "",
                    attributeId: attr.id, // ← FIX: Usar attr.id en lugar de string vacío
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

    // --- LÓGICA CRÍTICA: Obtener grupos reales basados en variantes cargadas ---
    // Esta función analiza las variantes actuales y extrae los valores únicos del atributo visual
    const getActiveVisualGroups = () => {
        if (!visualAttributeId) return ["General"];
        
        const activeValues = new Set<string>();
        variants.forEach(v => {
            const attr = v.attributes.find(a => a.attributeId === visualAttributeId);
            if (attr && attr.value) activeValues.add(attr.value);
        });
        
        return Array.from(activeValues);
    };

    const activeGroups = getActiveVisualGroups();

        // --- RENDERIZADO DINÁMICO DE DROPZONES ---
    const renderImageZones = () => {
        const visualAttr = attributes.find(a => a.id === visualAttributeId);
        
        // Si no hay atributo visual seleccionado, mostramos un cargador general
        if (!visualAttributeId || !visualAttr) {
            return (
                <div className="border-2 border-dashed p-4 rounded-md">
                    <span className="block mb-2 font-medium">Imágenes Generales</span>
                    <input 
                        type="file" multiple 
                        onChange={(e) => handleGroupedImagesChange("general", e.target.files)} 
                    />
                    {renderPreview("general")}
                </div>
            );
        }

        // Si hay atributo visual (ej: Color), generamos una zona por cada valor (Rojo, Azul, etc.)
        return (
            <div className="space-y-6">
                <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    Carga las imágenes específicas para cada <strong>{visualAttr.name}</strong>.
                </p>
                {visualAttr.values.map(val => (
                    <div key={val.id} className="border p-4 rounded-lg bg-white shadow-sm">
                        <span className="block mb-3 font-bold text-gray-700">Variante: {val.value}</span>
                        <input 
                            type="file" 
                            multiple 
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            onChange={(e) => handleGroupedImagesChange(val.value, e.target.files)} 
                        />
                        {renderPreview(val.value)}
                    </div>
                ))}
            </div>
        );
    };

    const renderPreview = (groupKey: string) => (
        <div className="grid grid-cols-3 gap-2 mt-3">
            {groupedNewImages[groupKey]?.map((file, idx) => (
                <div key={idx} className="relative group">
                    <img 
                        src={URL.createObjectURL(file)} 
                        className="w-full h-24 object-cover rounded-md" 
                        alt="preview" 
                    />
                    <button
                        type="button"
                        onClick={() => removeImageFromGroup(groupKey, idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <IoCloseOutline size={16} />
                    </button>
                </div>
            ))}
        </div>
    );

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

                // Enviamos la relación de qué imagen pertenece a qué grupo
        // Estructura: groupedNewImages = { "Rojo": [File1, File2], "Azul": [File3] }
        Object.entries(groupedNewImages).forEach(([groupValue, files]) => {
            files.forEach(file => {
                formData.append(`images_${groupValue}`, file); 
            });
        });

        formData.append('visualAttributeId', visualAttributeId || "");

        
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
    const generateMatrix = () => {
        const selectedAttrs = attributes.filter(attr => selectedAttributeIds.includes(attr.id));
        
        // Tipamos el acumulador como un array de arrays de ComboAttribute
        const combinations = selectedAttrs.reduce((acc: ComboAttribute[][], attr) => {
            const values = selectedValuesForMatrix[attr.id] || [];
            
            if (acc.length === 0) {
                return values.map(v => [{ attributeId: attr.id, value: v }]);
            }
            
            return acc.flatMap(combo => 
                values.map(v => [...combo, { attributeId: attr.id, value: v }])
            );
        }, []);

        const newVariants = combinations.map(combo => ({
            id: Math.random().toString(36).substring(7),
            price: getValues("diffPrice") ? "0" : (product?.variants?.[0]?.price.toString() || "0"),
            stock: "0",
            // Aquí 'c' ya sabe que tiene .value gracias al tipado de combinations
            sku: `${getValues("slug").toUpperCase()}-${combo.map((c: ComboAttribute) => c.value.substring(0,3).toUpperCase()).join("-")}`,
            attributes: combo.map((c: ComboAttribute) => ({
                attributeId: c.attributeId,
                value: c.value,
                valueId: attributes
                    .find(a => a.id === c.attributeId)
                    ?.values?.find(v => v.value === c.value)?.id || ""
            })),
            discountPercent: "0",
            order: 0
        }));

        setVariants([...variants, ...newVariants]);
    };

    // Esta función filtra las imágenes que ya pertenecen al producto según el grupo
    const getExistingImagesByGroup = (groupName: string) => {
        if (!product.ProductImage) return [];

        // Si el grupo es "General", mostramos imágenes que NO tienen variantes asociadas
        if (groupName === "General") {
            return product.ProductImage.filter(img => !img.variants || img.variants.length === 0);
        }

        // Si hay un atributo visual, filtramos imágenes cuya variante coincida con el nombre del grupo
        return product.ProductImage.filter(img => 
            img.variants?.some(v => 
                v.attributes.some(attr => attr.value === groupName)
            )
        );
    };

    return (
        <form onSubmit={handleSubmit(handleSubmitForm)} className="grid px-5 mb-16 grid-cols-1 sm:px-0 sm:grid-cols-2 gap-3">
            {/* Textos */}
            <div className="space-y-6">
                <section className="bg-white p-4 border rounded-md">
                    <h3 className="text-lg font-bold mb-4">1. Datos Generales</h3>
                    {/* ... (Título, Slug, Descripción) ... */}
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
                    {/* --- BLOQUE NUEVO: CONFIGURACIÓN DE ESTRUCTURA --- */}
                    <div className="bg-gray-50 p-4 border rounded-md mb-6">
                    <h3 className="text-sm font-bold uppercase text-gray-600 mb-4">Estructura de Atributos</h3>
                    
                    {/* Checkboxes de selección de atributos (esto ya lo tenías, mantenlo pero agrúpalo aquí) */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        {attributes.map((attr) => (
                        <label key={attr.id} className="flex items-center gap-2 bg-white border p-2 rounded-md cursor-pointer hover:shadow-sm">
                            <input
                            type="checkbox"
                            checked={selectedAttributeIds.includes(attr.id)}
                            onChange={(e) => handleAttributeCheckbox(attr.id, e.target.checked)}
                            />
                            <span className="text-sm">{attr.name}</span>
                        </label>
                        ))}
                    </div>

                    {/* NUEVO: Selectores múltiples para generar la matriz */}
                    {selectedAttributeIds.map(id => {
                        const attr = attributes.find(a => a.id === id);
                        return (
                        <div key={id} className="mb-4">
                            <label className="text-xs font-bold text-gray-500 mb-1 block">VALORES PARA {attr?.name}:</label>
                            <select 
                            multiple 
                            className="w-full border p-2 rounded-md h-32 text-sm focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => {
                                const vals = Array.from(e.target.selectedOptions).map(o => o.value);
                                setSelectedValuesForMatrix(prev => ({ ...prev, [id]: vals }));
                            }}
                            >
                            {attr?.values.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                            </select>
                            <p className="text-[10px] text-gray-400 mt-1">Mantén presionado Ctrl (o Cmd) para seleccionar varios</p>
                        </div>
                        );
                    })}
                    
                    <button 
                        type="button" 
                        onClick={generateMatrix} 
                        className="w-full bg-blue-600 text-white text-sm font-bold p-3 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        GENERAR COMBINACIONES AUTOMÁTICAMENTE
                    </button>
                    </div>
                </section>
                <section className="bg-white p-4 border rounded-md">
                    <h3 className="text-lg font-bold mb-4">2. Configuración de Variantes</h3>
                    {/* Selector de qué atributo es visual */}
                    <div className="mb-4">
                        <label className="text-sm font-medium">¿Qué atributo define las fotos?</label>
                        <select 
                            className="w-full p-2 border rounded-md"
                            value={visualAttributeId || ""}
                            onChange={(e) => setVisualAttributeId(e.target.value || null)}
                        >
                            <option value="">Ninguno (Fotos generales)</option>
                            {attributes
                                .filter(a => selectedAttributeIds.includes(a.id))
                                .map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                            }
                        </select>
                    </div>

                    <button type="button" 
                        className={`btn-primary mb-4 ${selectedAttributeIds.length === 0 ? 'btn-disabled' : ''}`}
                        disabled={selectedAttributeIds.length === 0} 
                        onClick={openAddVariantModal}>
                        + Agregar Variante
                    </button>

                    {/* Tu Tabla de Variantes Actualizada */}
                    <div className="overflow-x-auto">
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
                                                className={`text-blue-600 underline mr-2 ${selectedAttributeIds.length === 0 ? 'disabled:cursor-not-allowed': ''}`}
                                                onClick={() => openEditVariantModal(idx)}
                                                disabled={selectedAttributeIds.length === 0}
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
                    </div>
                </section>
            </div>

            {/* COLUMNA DERECHA: Activos Visuales */}
            <div className="space-y-6">
                <section className="bg-gray-50 p-4 border rounded-md sticky top-4">
                   {/* --- BLOQUE NUEVO: GALERÍA POR VARIANTE --- */}
                    <div className="flex flex-col mb-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <h3 className="text-sm font-bold uppercase text-gray-600 mb-4">3. Galería de Fotos</h3>

                        {/* Selector de Atributo Visual */}
                        <div className="mb-6">
                            <label className="text-xs font-bold text-blue-700 mb-2 block">¿QUÉ ATRIBUTO CAMBIA LA FOTO?</label>
                            <select 
                            className="w-full p-2 border rounded-md bg-white text-sm"
                            value={visualAttributeId || ""}
                            onChange={(e) => setVisualAttributeId(e.target.value)}
                            >
                            <option value="">Ninguno (Fotos generales únicamente)</option>
                            {attributes
                                .filter(a => selectedAttributeIds.includes(a.id))
                                .map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                            }
                            </select>
                        </div>

                        {/* Zonas de carga dinámicas basadas en las variantes de la tabla */}
                        <div className="space-y-6">
                            {Array.from(new Set(variants.map(v => 
                                v.attributes.find(a => a.attributeId === visualAttributeId)?.value || "General"
                            ))).map(groupName => (
                            <div key={groupName} className="p-3 bg-white border rounded-md shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-gray-700">Fotos: {groupName}</span>
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">Grupo</span>
                                </div>
                                
                                <input 
                                type="file" 
                                multiple 
                                accept="image/*"
                                className="text-xs w-full mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700"
                                onChange={(e) => handleGroupedImagesChange(groupName, e.target.files)} 
                                />

                                {/* imagenes a mostar */}
                                <div className="grid grid-cols-4 gap-2">
                                
                                {/* A. IMÁGENES QUE YA ESTÁN EN EL SERVIDOR */}
                                {getExistingImagesByGroup(groupName).map((img) => (
                                    <div key={img.id} className="relative aspect-square">
                                    <img 
                                        src={img.url} 
                                        className="w-full h-full object-cover rounded-md border-2 border-blue-200" 
                                        alt="server-image"
                                    />
                                    <button 
                                        type="button"
                                        // Función para agregar al array imagesToDelete
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md"
                                    >
                                        <IoCloseOutline size={12}/>
                                    </button>
                                    </div>
                                ))}

                                {/* B. IMÁGENES NUEVAS (LOCALES) - Tu lógica actual */}
                                {groupedNewImages[groupName]?.map((file, idx) => (
                                    <div key={idx} className="relative aspect-square">
                                    <img 
                                        src={URL.createObjectURL(file)} 
                                        className="w-full h-full object-cover rounded-md border-2 border-green-200" 
                                        alt="preview"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => removeImageFromGroup(groupName, idx)}
                                        className="absolute -top-1 -right-1 bg-gray-500 text-white rounded-full p-0.5"
                                    >
                                        <IoCloseOutline size={12}/>
                                    </button>
                                    </div>
                                ))}
                                </div>

                                {/* Preview de imágenes del grupo */}
                                <div className="grid grid-cols-4 gap-2">
                                {groupedNewImages[groupName]?.map((file, idx) => (
                                    <div key={idx} className="relative aspect-square">
                                    <img 
                                        src={URL.createObjectURL(file)} 
                                        className="w-full h-full object-cover rounded-md border" 
                                        alt="preview"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => removeImageFromGroup(groupName, idx)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md"
                                    >
                                        <IoCloseOutline size={12}/>
                                    </button>
                                    </div>
                                ))}
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                </section>
                
                <button className="btn-primary w-full py-4 text-xl">
                    Guardar
                </button>
            </div>
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
