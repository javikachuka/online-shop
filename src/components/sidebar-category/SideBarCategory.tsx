"use client";
import { Category } from "@/interfaces";
import Link from "next/link";
import { useState } from "react";
import { IoCaretDown } from "react-icons/io5";

// Componente recursivo para renderizar categorías y subcategorías en el sidebar
interface SidebarCategoryProps {
    category: Category;
    parentSlugs?: string[];
    onClick: () => void;
}

export const SidebarCategory = ({
    category,
    parentSlugs = [],
    onClick
}: SidebarCategoryProps) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const currentSlugs = [...parentSlugs, category.slug];
    const hasChildren =
        category.subcategories && category.subcategories.length > 0;
    return (
        <div className="mb-2">
            {hasChildren && (
                <div
                    className="flex justify-between my-2 font-semibold py-1 px-2  text-gray-700 hover:bg-gray-200 hover:cursor-pointer rounded"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {category.name}
                    {isOpen ? (
                        <IoCaretDown className="self-center transform rotate-180" />
                    ) : (
                        <IoCaretDown className="self-center" />
                    )}
                </div>
            )}
            {hasChildren && isOpen && (
                <div className=" border-l border-gray-200 pl-2">
                    {category.subcategories.map((subcat) => (
                        <SidebarCategory
                            key={subcat.id}
                            category={subcat}
                            parentSlugs={currentSlugs}
                            onClick={onClick}
                        />
                    ))}
                    <Link
                        href={`/categoria/${currentSlugs.join("/")}`}
                        className="block my-2 text-blue-600 hover:underline text-sm"
                        onClick={onClick}
                    >
                        Ver todo {category.name}
                    </Link>
                </div>
            )}
            
            {
                !hasChildren && (
                    <Link
                        href={`/categoria/${currentSlugs.join("/")}`}
                        className="block my-2 px-2 py-1 text-gray-700 hover:underline rounded"
                        onClick={onClick}
                    >
                        {category.name}
                    </Link>
                )
            }
        </div>
    );
};
