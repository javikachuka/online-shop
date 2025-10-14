import React, { useState } from "react";
import { saveOrUpdateCategory } from "@/actions/category/saveOrUpdateCategory";
import { useRouter } from "next/navigation";

interface CategoryFormProps {
  category?: any;
  categories: any[];
  onClose: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ category, categories, onClose }) => {
  const router = useRouter();
  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [description, setDescription] = useState(category?.description || "");
  const [parentId, setParentId] = useState(category?.parentId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(category?.isEnabled ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await saveOrUpdateCategory({
      id: category?.id,
      name,
      slug,
      description,
      parentId: parentId || undefined,
      isEnabled,
    });
    setLoading(false);
    console.log({result});
    
    if (!result.ok) {
      setError(result.error || "Error al guardar la categoría");
      return;
    }
    onClose();
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-semibold mb-1">Nombre</label>
        <input
          type="text"
          className="p-2 border rounded-md w-full"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1">Slug</label>
        <input
          type="text"
          className="p-2 border rounded-md w-full"
          value={slug}
          onChange={e => setSlug(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1">Descripción</label>
        <textarea
          className="p-2 border rounded-md w-full"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1">Categoría Padre</label>
        <select
          className="p-2 border rounded-md w-full"
          value={parentId}
          onChange={e => setParentId(e.target.value)}
        >
          <option value="">Raíz (sin padre)</option>
          {categories.filter(c => !category || c.id !== category.id).map(c => {
            // Construir la jerarquía de padres
            let parentNames: string[] = [];
            let currentParentId = c.parentId;
            while (currentParentId) {
              const parent = categories.find(p => p.id === currentParentId);
              if (parent) {
                parentNames.unshift(parent.name);
                currentParentId = parent.parentId;
              } else {
                break;
              }
            }
            const fullPath = parentNames.length > 0 ? `${parentNames.join(' / ')} / ${c.name}` : c.name;
            return (
              <option key={c.id} value={c.id}>{fullPath}</option>
            );
          })}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold mb-1">Estado</label>
        <select
          className="p-2 border rounded-md w-full"
          value={isEnabled ? "enabled" : "disabled"}
          onChange={e => setIsEnabled(e.target.value === "enabled")}
        >
          <option value="enabled">Habilitada</option>
          <option value="disabled">Deshabilitada</option>
        </select>
      </div>
      <div className="flex gap-2 justify-end mt-4">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</button>
      </div>
      {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
    </form>
  );
};
