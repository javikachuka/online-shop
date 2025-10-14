'use client'

interface Props {
    slug: string
}

import { getStockBySlug } from "@/actions";
import { titleFont } from "@/config/fonts";
import { useEffect, useState } from "react";

export const StockLabel = ({slug}: Props) => {

    const [stock, setStock] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        getStock()
    }, [])

    const getStock = async () => {
        const inStock = await getStockBySlug(slug)
        console.log(inStock);

        setStock(inStock)
        setIsLoading(false)
        
    }
    

    return (
        <>
            {
                isLoading 
                ? 
                <h2 className={`${titleFont.className} antialiased font-bold text-md bg-gray-200 animate-pulse `}>
                    &nbsp;
                </h2>
                :
                <h2 className={`${titleFont.className} antialiased font-bold text-md`}>
                    Stock: {stock}
                </h2>
            }
        </>
    );
};
