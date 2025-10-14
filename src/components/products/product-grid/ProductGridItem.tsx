'use client'

import { ProductImage } from "@/components/product/product-image/ProductImage"
import { Product } from "@/interfaces"
import { currencyFormat } from "@/utils"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

interface Props {
    product: Product
}


export const ProductGridItem = ({product}:Props) => {


    const [displayImage, setDisplayImage] = useState(product.ProductImage?.[0]?.url)

    const handleMouseEnter = () => {
        if(product.ProductImage?.[1]){
            setDisplayImage(product.ProductImage?.[1]?.url)
        }
    }
    
    const handleMouseLeave = () => {
        setDisplayImage(product.ProductImage?.[0]?.url)
    }

  return (
    <div className="rounded-md overflow-hidden fade-in">
        <Link href={`/product/${product.slug}`}>
            <ProductImage 
                src={displayImage}
                alt={product.title}
                className="w-full object-cover rounded"
                width={500}
                height={500}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            />
        </Link>
        <div className="md:p-4 flex flex-col">
            <Link href={`/product/${product.slug}`} className="text-sm md:text-base hover:text-blue-600">
                {product.title}
            </Link>
            {product.variants?.[0]?.discountPercent && product.variants[0].discountPercent > 0 ? (
                <div className="flex items-center gap-1 flex-wrap text-xs sm:text-sm md:text-base">
                    <span className="line-through text-gray-400 md:text-sm">
                        {currencyFormat(product.variants[0].price)}
                    </span>
                    <span className="font-bold text-red-600">
                        {currencyFormat(product.variants[0].price * (1 - product.variants[0].discountPercent / 100))}
                    </span>
                </div>
            ) : (
                <span className="font-bold text-sm md:text-base">
                    { currencyFormat(product.variants?.[0]?.price || 0) }
                </span>
            )}
        </div>
    </div>
  )
}
