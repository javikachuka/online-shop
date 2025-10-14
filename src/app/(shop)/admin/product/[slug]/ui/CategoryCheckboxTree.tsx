import { Category } from "@/interfaces";


export function CategoryCheckboxTree({ categories, selectedIds, onChange, parentId = null }: {
  categories: Category[];
  selectedIds: string[];
  onChange: (id: string, checked: boolean) => void;
  parentId?: string | null;
}) {
  // Solo mostrar categorías que tienen el parentId actual
  const filteredCategories = categories.filter(cat => cat.parentId === parentId);

  // Helper para obtener el parentId de una categoría
  const getParentId = (id: string) => {
    const cat = categories.find(c => c.id === id);
    return cat?.parentId ?? null;
  };

  // Handler que marca el padre si se marca una subcategoría
  const handleChange = (id: string, checked: boolean) => {
    onChange(id, checked);
    if (checked) {
      let parent = getParentId(id);
      while (parent) {
        if (!selectedIds.includes(parent)) {
          onChange(parent, true);
        }
        parent = getParentId(parent);
      }
    }
  };

  return (
    <div className={parentId ? "ml-4 border-l border-gray-200 pl-2" : ""}>
      {filteredCategories.map(category => (
        <div key={category.id} className="mb-1">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.includes(category.id)}
              onChange={e => handleChange(category.id, e.target.checked)}
            />
            <span>{category.name}</span>
          </label>
          {categories.some(cat => cat.parentId === category.id) && (
            <CategoryCheckboxTree
              categories={categories}
              selectedIds={selectedIds}
              onChange={onChange}
              parentId={category.id}
            />
          )}
        </div>
      ))}
    </div>
  );
}