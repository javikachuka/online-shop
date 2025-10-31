"use client";

import { useState } from "react";
import { AttributeWithValues } from "@/interfaces";
import { saveUpdateAttribute } from "@/actions";
import { Toaster, toast } from 'sonner';
import { useRouter } from "next/navigation";


interface Props {
    attribute?: AttributeWithValues;
}

export const AttributesForm = ({ attribute }: Props) => {
    const router = useRouter()
    const [name, setName] = useState(attribute?.name || "");
    const [values, setValues] = useState<string[]>(attribute?.values?.map(v => v.value) || [""]);
    const [newValue, setNewValue] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleValueChange = (idx: number, val: string) => {
        setValues(values => values.map((v, i) => (i === idx ? val : v)));
    };

    const handleAddValue = () => {
        if (newValue.trim() && !values.includes(newValue.trim())) {
            setValues([...values, newValue.trim()]);
            setNewValue("");
        }
    };

    const handleRemoveValue = (idx: number) => {
        setValues(values => values.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSubmitting) return;
        
        if (!name.trim()) {
            setError("El nombre es obligatorio");
            return;
        }
        if (values.length === 0 || values.some(v => !v.trim())) {
            setError("Todos los valores deben estar completos");
            return;
        }
        
        setError("");
        setIsSubmitting(true);
        
        try {
            const jsonData = { id: attribute?.id, name: name.trim(), values };
            const response: any = await saveUpdateAttribute(jsonData);

            if (!response.ok) {
                setError(response.error || "Error al guardar el atributo");
                toast.error(`Error al guardar el atributo: ${response.error}`);
                return;
            }
            
            if (attribute?.id) {
                toast.success("Atributo actualizado con éxito");
                if (response.warning) {
                    toast.warning(response.warning);
                }
            } else {
                toast.success("Atributo creado con éxito")
                router.push(`/admin/attributes`)
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setError("Error inesperado al guardar");
            toast.error("Error inesperado al guardar");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="grid px-5 mb-16 grid-cols-1 sm:px-0 sm:grid-cols-2 gap-3" onSubmit={handleSubmit}>
            <div className="col-span-2 mb-2">
                <label className="block font-semibold mb-1">Nombre del atributo</label>
                <input
                    className="w-full border rounded px-3 py-2"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Color, Talle, Material"
                    disabled={isSubmitting}
                />
            </div>
            <div className="col-span-2 mb-2">
                <label className="block font-semibold mb-1">Valores posibles</label>
                {attribute && (
                    <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800">
                            ⚠️ <strong>Nota:</strong> Los valores que están siendo utilizados en productos no se eliminarán automáticamente.
                        </p>
                    </div>
                )}
                <div className="flex flex-wrap gap-2 mb-2">
                    {values.map((val, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                            <input
                                className="border rounded px-2 py-1"
                                value={val}
                                onChange={e => handleValueChange(idx, e.target.value)}
                                placeholder="Valor"
                                disabled={isSubmitting}
                            />
                            <button 
                                type="button" 
                                className="text-red-500 px-1 hover:text-red-700" 
                                onClick={() => handleRemoveValue(idx)} 
                                title="Eliminar valor"
                                disabled={isSubmitting}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        className="border rounded px-2 py-1"
                        value={newValue}
                        onChange={e => setNewValue(e.target.value)}
                        placeholder="Agregar nuevo valor"
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddValue(); } }}
                        disabled={isSubmitting}
                    />
                    <button 
                        type="button" 
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-400" 
                        onClick={handleAddValue}
                        disabled={isSubmitting}
                    >
                        Agregar
                    </button>
                </div>
            </div>
            {error && <div className="col-span-2 text-red-600 font-semibold">{error}</div>}
            <div className="col-span-2 flex justify-end mt-4">
                <button 
                    type="submit" 
                    className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed" 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
            <Toaster
                position="bottom-right"
            />
        </form>
    );
};
