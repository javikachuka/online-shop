'use client'
import { useEffect, useState } from "react";
import Link from "next/link"
import { titleFont } from "@/config/fonts"
import { IoCartOutline, IoSearchOutline } from "react-icons/io5"
import { useCartStore, useUIStore } from "@/store";
import { Category } from "@/interfaces";
import { SearchInput } from "../search/SearchInput";
import { MobileSearchModal } from "../search/MobileSearchModal";
import Image from "next/image";


interface Props {
    categories?: Category[];
    company?: { name: string; logo: string | null; } | undefined;
}

export const TopMenu = ({categories = [], company}: Props) => {

    const openMenu = useUIStore((state) => state.openSideMenu);
    const totalItemsInCart = useCartStore(state => state.getTotalItems())
    
    const [loaded, setLoaded] = useState(false)
    const [showMobileSearch, setShowMobileSearch] = useState(false)

    useEffect(() => {
        setLoaded(true)
    },[])
  return (
    <nav className="flex px-5 justify-between items-center w-full">
        <div>
            <Link
                href={'/'}
            >
                {company?.logo 
                    ? <Image 
                        src={company.logo} 
                        alt={company.name || 'Logo'} 
                        className="object-contain max-h-[50px]"
                        width={112}
                        height={40}
                      />
                    : <span>Name | Shop</span>
                }
            </Link>
        </div>

        {/* menu barra para desktop */}
        {/* <div className="hidden sm:block relative">    
            {categories.map((category) => (
                <MenuItem key={category.id} category={category} parentSlugs={[]} />
            ))}
        </div> */}

        {/* Búsqueda para desktop */}
        <div className="hidden md:block">
            <SearchInput />
        </div>

        <div className="flex items-center">
            {/* Búsqueda para móvil */}
            <button
                onClick={() => setShowMobileSearch(true)}
                className="mx-2 md:hidden p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
                <IoSearchOutline className="w-5 h-5" />
            </button>
            <Link
                href={
                    (totalItemsInCart === 0 && loaded)
                    ? '/empty'
                    : '/cart'
                }
                className="mx-2"
            >
                <div className="relative">
                    {
                        (loaded && totalItemsInCart > 0) && (
                            <span className="fade-in absolute text-xs rounded-full px-1 font-bold -top-2 -right-2 bg-blue-700 text-white">{totalItemsInCart}</span>
                        )
                    }
                    <IoCartOutline className="w-5 h-5"/>
                </div>
            </Link>

            <button 
                className="m-2 p-2 rounded-md transition-all hover:bg-gray-100"
                onClick={() => {openMenu()}}
            >
                Menu
            </button>

        </div>

        {/* Modal de búsqueda para móvil */}
        <MobileSearchModal 
            isOpen={showMobileSearch}
            onClose={() => setShowMobileSearch(false)}
        />

    </nav>
  )
}


