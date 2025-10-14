import { Category } from "@/interfaces";
import Link from "next/link";

// Componente recursivo para renderizar cualquier nivel de subcategorías
export const MenuItem = ({ category, parentSlugs = [] }: { category: Category, parentSlugs: string[] }) => {
    const currentSlugs = [...parentSlugs, category.slug];
    const hasChildren = category.subcategories && category.subcategories.length > 0;
    return (
        <div className={parentSlugs.length === 0 ? "group inline-block relative" : "group/sub relative"}>
            <Link
                className={parentSlugs.length === 0 ? "m-2 p-2 rounded-md transition-all hover:bg-gray-100" : "block px-4 py-2 hover:bg-gray-100 whitespace-nowrap"}
                href={`/categoria/${currentSlugs.join("/")}`}
            >
                {category.name}
            </Link>
            {hasChildren && (
                <div className={
                    parentSlugs.length === 0
                        ? "absolute left-0 top-full z-20 min-w-[180px] bg-white border rounded shadow-lg opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none transition-opacity duration-200"
                        : "absolute left-full top-0 z-30 min-w-[180px] bg-white border rounded shadow-lg opacity-0 group-hover/sub:opacity-100 group-hover/sub:pointer-events-auto pointer-events-none transition-opacity duration-200"
                }>
                    {category.subcategories.map((subcat) => (
                        <MenuItem key={subcat.id} category={subcat} parentSlugs={currentSlugs} />
                    ))}
                </div>
            )}
        </div>
    );
}