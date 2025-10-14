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
        if (!name.trim()) {
            setError("El nombre es obligatorio");
            return;
        }
        if (values.length === 0 || values.some(v => !v.trim())) {
            setError("Todos los valores deben estar completos");
            return;
        }
        setError("");
        const jsonData = { id: attribute?.id ,name: name.trim(), values };

        const response = await saveUpdateAttribute(jsonData);

        if (!response.ok) {
            setError(response.error || "Error al guardar el atributo");
            toast.error(`Error al guardar el atributo`);
            return;
        }
        if(attribute?.id){
            toast.success("Atributo actualizado con éxito")
        }else{
            toast.success("Atributo creado con éxito")
            router.push(`/admin/attributes`)
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
                />
            </div>
            <div className="col-span-2 mb-2">
                <label className="block font-semibold mb-1">Valores posibles</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {values.map((val, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                            <input
                                className="border rounded px-2 py-1"
                                value={val}
                                onChange={e => handleValueChange(idx, e.target.value)}
                                placeholder="Valor"
                            />
                            <button type="button" className="text-red-500 px-1" onClick={() => handleRemoveValue(idx)} title="Eliminar valor">×</button>
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
                    />
                    <button type="button" className="bg-blue-500 text-white px-3 py-1 rounded" onClick={handleAddValue}>Agregar</button>
                </div>
            </div>
            {error && <div className="col-span-2 text-red-600 font-semibold">{error}</div>}
            <div className="col-span-2 flex justify-end mt-4">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded font-bold">Guardar</button>
            </div>
            <Toaster
                position="bottom-right"
            />
        </form>
    );
};
