'use client'

import { useEffect, useState } from "react"
import { ProductImage } from "@/interfaces"
import dynamic from "next/dynamic"

const ProductSlidesShow = dynamic(() =>
    import("./ProductSlidesShow").then((mod) => mod.ProductSlidesShow)
)
const ProductSlidesShowMobile = dynamic(() =>
    import("./ProductSlidesShowMobile").then((mod) => mod.ProductSlidesShowMobile)
)

interface Props {
    images: ProductImage[]
    title: string
}

export const SlideShowSwitcher = ({ images, title }: Props) => {
    const [isMobile, setIsMobile] = useState<boolean | null>(null)

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 768px)")
        setIsMobile(mediaQuery.matches)

        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
        mediaQuery.addEventListener("change", handler)
        return () => mediaQuery.removeEventListener("change", handler)
    }, [])

    // Evita flash mientras detecta el tamaño
    if (isMobile === null) return null

    return isMobile
        ? <ProductSlidesShowMobile title={title} images={images} />
        : <ProductSlidesShow title={title} images={images} />
}