'use client'

import { useEffect, useMemo, useState } from "react"
import { ProductImage, ProductVariant } from "@/interfaces"
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
        if (!imageGroupingAttributeId || !selectedVariantId || variants.length === 0) {
            return images
        }

        const selectedVariant = variants.find((variant) => variant.id === selectedVariantId)
        if (!selectedVariant) return images

        const selectedVisualValue = selectedVariant.attributes.find(
            (attr) => attr.attributeId === imageGroupingAttributeId
        )?.value?.value

        if (!selectedVisualValue) return images

        const imagesForVariant = images.filter((image) => {
            if (!image.variants || image.variants.length === 0) return false

            return image.variants.some((variantRef) => {
                if (variantRef.id === selectedVariantId) return true

                return variantRef.attributes?.some(
                    (attribute) =>
                        attribute.attributeId === imageGroupingAttributeId &&
                        attribute.value?.value === selectedVisualValue
                )
            })
        })

        return imagesForVariant.length > 0 ? imagesForVariant : images
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