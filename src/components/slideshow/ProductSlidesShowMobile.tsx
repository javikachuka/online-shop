"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode, Pagination } from "swiper/modules";
import Image from "next/image";

// Import Swiper styles
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";

import "./ProductSlidesShow.css";
import { ProductImage } from "@/interfaces";

interface Props {
    images: ProductImage[];
    title: string;
    className?: string;
}

export const ProductSlidesShowMobile = ({ images, title, className }: Props) => {

    return (
        <div className={className}>
            <Swiper
                style={{
                    width: '100vw',
                    height: '350px'
                }}
                pagination
                autoplay={
                    {
                        delay: 2500
                    }
                }
                modules={[FreeMode, Autoplay, Pagination]}
                className="mySwiper2"
            >
                {images.map((image) => (
                    <SwiperSlide key={image.id}>
                        <Image
                            width={600}
                            height={500}
                            src={`/products/${image.url}`}
                            alt={title}
                        />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};
