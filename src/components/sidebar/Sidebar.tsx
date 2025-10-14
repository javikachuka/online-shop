"use client";

import Link from "next/link";
import {
    IoCloseOutline,
    IoLogInOutline,
    IoLogOutOutline,
    IoPeopleOutline,
    IoPersonOutline,
    IoSearchOutline,
    IoShirtOutline,
    IoTicketOutline,
    IoColorPaletteOutline,
    IoPricetagOutline,
    IoBusinessOutline
} from "react-icons/io5";
import { useUIStore } from "@/store";
import { signOut, useSession } from "next-auth/react";
import { Category } from "@/interfaces";
import { SidebarCategory } from "../sidebar-category/SideBarCategory";

interface Props {
    categories?: Category[];
}

export const Sidebar = ({categories = []}: Props) => {
    const isSideMenuOpen = useUIStore((state) => state.isSideMenuOpen);
    const closeMenu = useUIStore((state) => state.closeSideMenu);

    const {data: session} = useSession()
    const isAuthenticated = !!session?.user
    const isAdmin = session?.user?.role === 'admin' || false
    

    const onClickLogout = () => {
        closeMenu()
        signOut({ callbackUrl: "/" })
    }

    

    return (
        <div>
            {/* Background black */}
            {isSideMenuOpen && (
                <div className="fixed top-0 left-0 w-screen h-screen z-10 bg-black opacity-30" />
            )}

            {/* Blur */}
            {isSideMenuOpen && (
                <div 
                    onClick={() => closeMenu()}
                    className="fade-in fixed top-0 left-0 w-screen h-screen z-10 backdrop-filter backdrop-blur-sm" />
            )}

            {/* SideMenu */}
            <nav
                //todo efect
                className={`fixed p-5 pt-10 right-0 top-0 max-sm:w-full w-[500px] h-screen overflow-scroll overflow-x-hidden bg-white z-20 shadow-2xl transform transition-all duration-300 ${!isSideMenuOpen ? 'translate-x-full' : ''}`}
            >
                <IoCloseOutline
                    size={35}
                    className="absolute top-5 right-5 cursor-pointer"
                    onClick={() => closeMenu()}
                />

                {/* <div className="relative mt-14">
                    <IoSearchOutline
                        size={20}
                        className="absolute top-2 left-2"
                    />
                    <input
                        type="text"
                        placeholder="Buscar"
                        className="w-full bg-gray-50 pl-10 py-1 pr-10 border-b-2 text-xl border-gray-200 focus:outline-none focus:border-blue-500"
                    ></input>
                </div> */}


                {/* Categorías dinámicas - no login - no user*/}
                <div className="mt-5">
                    {categories.map((category) => (
                        <SidebarCategory key={category.id} category={category} parentSlugs={[]} onClick={() => closeMenu()} />
                    ))}
                </div>
                
                {/* Menu options*/}
                {
                    isAuthenticated && (
                        <>
                            <Link
                                href={"/profile"}
                                onClick={() => closeMenu()}
                                className="flex items-center mt-10 p-2 hover:bg-gray-100 rounded transition-all"
                            >
                                <IoPersonOutline size={30} />
                                <span className="ml-3 text-xl">Perfil</span>
                            </Link>
                            <Link
                                href={"/orders"}
                                onClick={() => closeMenu()}
                                className="flex items-center mt-10 p-2 hover:bg-gray-100 rounded transition-all"
                            >
                                <IoTicketOutline size={30} />
                                <span className="ml-3 text-xl">Mis pedidos</span>
                            </Link>
                        </>     
                    )
                }

                {
                    isAuthenticated && (
                        <button
                            className="flex w-full items-center mt-10 p-2 hover:bg-gray-100 rounded transition-all"
                            onClick={() => onClickLogout()}
                        >
                            <IoLogOutOutline size={30} />
                            <span className="ml-3 text-xl">Salir</span>
                        </button>
                        
                    )
                }
                {
                    !isAuthenticated && (
                        <Link
                            href={"/auth/login"}
                            onClick={() => closeMenu()}
                            className="flex items-center mt-10 p-2 hover:bg-gray-100 rounded transition-all"
                        >
                            <IoLogInOutline size={30} />
                            <span className="ml-3 text-xl">Ingresar</span>
                        </Link>
                    )
                }
                
                {/* Line separator */}
                <div className="w-full h-px bg-gray-200 my-10"></div>
                {
                    isAdmin && isAuthenticated && (
                        <>
                            
                            <Link
                                href={"/admin/orders"}
                                onClick={() => closeMenu()}
                                className="flex items-center mt-10 p-2 hover:bg-gray-100 rounded transition-all"
                            >
                                <IoTicketOutline size={30} />
                                <span className="ml-3 text-xl">Pedidos</span>
                            </Link>
                            <Link
                                href={"/admin/products"}
                                onClick={() => closeMenu()}
                                className="flex items-center mt-10 p-2 hover:bg-gray-100 rounded transition-all"
                            >
                                <IoShirtOutline size={30} />
                                <span className="ml-3 text-xl">Productos</span>
                            </Link>
                            <Link
                                href={"/admin/users"}
                                onClick={() => closeMenu()}
                                className="flex items-center mt-10 p-2 hover:bg-gray-100 rounded transition-all"
                            >
                                <IoPeopleOutline size={30} />
                                <span className="ml-3 text-xl">Usuarios</span>
                            </Link>
                            <Link
                                href={"/admin/attributes"}
                                onClick={() => closeMenu()}
                                className="flex items-center mt-10 p-2 hover:bg-gray-100 rounded transition-all"
                            >
                                <IoColorPaletteOutline size={30} />
                                <span className="ml-3 text-xl">Atributos</span>
                            </Link>
                            <Link
                                href={"/admin/categorias"}
                                onClick={() => closeMenu()}
                                className="flex items-center mt-10 p-2 hover:bg-gray-100 rounded transition-all"
                            >
                                <IoPricetagOutline size={30} />
                                <span className="ml-3 text-xl">Categorias</span>
                            </Link>
                            <Link
                                href={"/admin/company"}
                                onClick={() => closeMenu()}
                                className="flex items-center mt-10 p-2 hover:bg-gray-100 rounded transition-all"
                            >
                                <IoBusinessOutline size={30} />
                                <span className="ml-3 text-xl">Empresa</span>
                            </Link>
                        </>
                    )
                }
            </nav>
        </div>
    );
};
