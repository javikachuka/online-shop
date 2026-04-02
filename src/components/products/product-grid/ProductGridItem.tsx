'use client'

import { ProductImage } from "@/components/product/product-image/ProductImage"
import { Product } from "@/interfaces"
import { currencyFormat } from "@/utils"
import Link from "next/link"
import { useState } from "react"

interface Props {
    product: Product
}


export const ProductGridItem = ({product}:Props) => {


    const [displayImage, setDisplayImage] = useState(product.ProductImage?.[0]?.url)
    const hasSecondaryImage = !!product.ProductImage?.[1]?.url

    const handleMouseEnter = () => {
        if(hasSecondaryImage){
            setDisplayImage(product.ProductImage?.[1]?.url)
        }
    }
    
    const handleMouseLeave = () => {
        setDisplayImage(product.ProductImage?.[0]?.url)
    }

  return (
    <div className="rounded-md overflow-hidden fade-in group">
        <Link href={`/product/${product.slug}`}>
            <div
                className="w-full aspect-square sm:aspect-[4/5] lg:aspect-[15/16] overflow-hidden rounded bg-gray-100"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <ProductImage 
                    src={displayImage}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    width={500}
                    height={625}
                />
            </div>
        </Link>
        <div className="pt-2 md:p-4 flex flex-col">
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
