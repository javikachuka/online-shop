'use client'
import { useEffect, useState } from "react";
import Link from "next/link"
import { IoCartOutline, IoPersonOutline, IoSearchOutline } from "react-icons/io5"
import { useCartStore, useUIStore } from "@/store";
import { Category } from "@/interfaces";
import { SearchInput } from "../search/SearchInput";
import { MobileSearchModal } from "../search/MobileSearchModal";
import Image from "next/image";
import { useSession } from "next-auth/react";


interface Props {
    categories?: Category[];
    company?: { name: string; logo: string | null; } | undefined;
}

export const TopMenu = ({categories = [], company}: Props) => {

    const openMenu = useUIStore((state) => state.openSideMenu);
    const totalItemsInCart = useCartStore(state => state.getTotalItems())
    const { data: session, status } = useSession()
    const isAuthenticated = status === 'authenticated' && !!session?.user
    const accountHref = isAuthenticated ? '/profile' : '/auth/login?redirectTo=/profile'
    const accountLabel = isAuthenticated ? 'Mi perfil' : 'Iniciar sesion'
    const accountStatusLabel = isAuthenticated ? 'Sesion iniciada' : 'Inicia sesion'
    const accountInitial = session?.user?.name?.trim().charAt(0).toUpperCase()
    
    const [loaded, setLoaded] = useState(false)
    const [showMobileSearch, setShowMobileSearch] = useState(false)

    useEffect(() => {
        setLoaded(true)
    },[])
  return (
    <nav className="flex px-4 md:px-5 justify-between items-center w-full">
        <div>
            <Link
                href={'/'}
            >
                {company?.logo 
                    ? <Image 
                        src={company.logo} 
                        alt={company.name || 'Logo'} 
                        className="object-contain max-h-[50px] max-md:object-left"
                        width={112}
                        height={40}
                        priority
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
            <Link
                href={accountHref}
                className="mx-2 flex items-center gap-2 rounded-full border border-gray-200 px-2 py-1.5 transition-all hover:bg-gray-100"
                aria-label={accountLabel}
                title={accountStatusLabel}
            >
                <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-900 text-sm font-semibold text-white">
                    {isAuthenticated && accountInitial ? (
                        <span>{accountInitial}</span>
                    ) : (
                        <IoPersonOutline className="h-4 w-4" />
                    )}
                    <span
                        className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${isAuthenticated ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                </div>
                <div className="hidden md:flex md:flex-col md:leading-tight">
                    <span className="text-xs text-gray-500">
                        {accountStatusLabel}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{accountLabel}</span>
                </div>
            </Link>

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


