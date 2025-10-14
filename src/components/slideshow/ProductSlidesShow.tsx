"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwipperObject } from "swiper";
import { Autoplay, FreeMode, Navigation, Thumbs } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

import "./ProductSlidesShow.css";
import Image from "next/image";
import { ProductImage } from "@/interfaces";
import { ProductImage as ProductImageCmp } from "../product/product-image/ProductImage";

interface Props {
    images: ProductImage[];
    title: string;
    className?: string;
}

export const ProductSlidesShow = ({ images, title, className }: Props) => {
    const [thumbsSwiper, setThumbsSwiper] = useState<SwipperObject>();

    return (
        <div className={className}>
            <Swiper
                style={
                    {
                        "--swiper-navigation-color": "#fff",
                        "--swiper-pagination-color": "#fff",
                    } as React.CSSProperties
                }
                spaceBetween={10}
                navigation={true}
                // autoplay={
                //     {
                //         delay: 2500
                //     }
                // }
                thumbs={{ swiper: thumbsSwiper }}
                modules={[FreeMode, Navigation, Thumbs, Autoplay]}
                className="mySwiper2"
            >
                {images.map((image) => (
                    <SwiperSlide key={image.id}>
                        <ProductImageCmp
                            width={1024}
                            height={600}
                            src={image.url}
                            alt={title}
                            className="rounded-lg"
                        />
                    </SwiperSlide>
                ))}
            </Swiper>
            <Swiper
                onSwiper={setThumbsSwiper}
                spaceBetween={10}
                slidesPerView={4}
                freeMode={true}
                watchSlidesProgress={true}
                modules={[FreeMode, Navigation, Thumbs]}
                className="mySwiper"
            >
                {images.map((image) => (
                    <SwiperSlide key={image.id}>
                        <ProductImageCmp
                            width={300}
                            height={300}
                            src={image.url}
                            alt={title}
                            className="rounded-lg"
                        />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};
