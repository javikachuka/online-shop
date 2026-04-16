'use client'

import { useEffect, useMemo, useState } from "react"
import { ProductImage, ProductVariant } from "@/interfaces"
import dynamic from "next/dynamic"
import { getImagesForVariant } from "@/utils/product-image-utils"

const ProductSlidesShow = dynamic(() =>
    import("./ProductSlidesShow").then((mod) => mod.ProductSlidesShow)
)
const ProductSlidesShowMobile = dynamic(() =>
    import("./ProductSlidesShowMobile").then((mod) => mod.ProductSlidesShowMobile)
)

interface Props {
    images: ProductImage[]
    title: string
    selectedVariantId?: string | null
    imageGroupingAttributeId?: string | null
    variants?: ProductVariant[]
}

export const SlideShowSwitcher = ({
    images,
    title,
    selectedVariantId = null,
    imageGroupingAttributeId = null,
    variants = []
}: Props) => {
    const [isMobile, setIsMobile] = useState<boolean | null>(null)

    const filteredImages = useMemo(() => {
        return getImagesForVariant(
            images,
            selectedVariantId,
            imageGroupingAttributeId,
            variants
        )
    }, [images, imageGroupingAttributeId, selectedVariantId, variants])

    const sliderKey = filteredImages.map((image) => image.id).join('-')

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
        ? <ProductSlidesShowMobile key={sliderKey} title={title} images={filteredImages} />
        : <ProductSlidesShow key={sliderKey} title={title} images={filteredImages} />
}