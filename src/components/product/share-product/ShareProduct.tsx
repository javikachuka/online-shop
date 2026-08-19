'use client';

import { useState } from "react";
import { IoLogoWhatsapp, IoLinkOutline, IoCheckmarkOutline } from "react-icons/io5";
import { toast } from "sonner";
import { ProductVariantAttribute } from "@/interfaces";

interface Props {
    productTitle: string;
    variantAttributes?: ProductVariantAttribute[];
}

export const ShareProduct = ({ productTitle, variantAttributes }: Props) => {
    const [copied, setCopied] = useState(false);

    // Se construye al momento del click (no reactivo) para no depender de hooks de next/navigation
    // que forzarían este componente a un render dinámico y remontarían el slideshow de Swiper.
    // La URL visible en la barra de direcciones nunca se modifica: los query params de la variante
    // seleccionada se agregan solo acá, al generar el link para compartir.
    const getShareUrl = () => {
        const { origin, pathname } = window.location;
        const params = new URLSearchParams();
        variantAttributes?.forEach((attr) => {
            params.set(attr.attribute.name, attr.value.value);
        });
        const query = params.toString();
        return `${origin}${pathname}${query ? `?${query}` : ""}`;
    };

    const handleWhatsAppShare = () => {
        const message = `¡Mirá este producto! ${productTitle} ${getShareUrl()}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(getShareUrl());
            setCopied(true);
            toast.success("Enlace copiado al portapapeles");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("No se pudo copiar el enlace");
        }
    };

    return (
        <div className="mt-4 mb-2">
            <h2 className="font-bold text-sm mb-2">Compartir</h2>
            <div className="flex gap-2 flex-wrap">
                <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="btn-outline flex items-center gap-2"
                    aria-label="Compartir por WhatsApp"
                >
                    <IoLogoWhatsapp className="text-lg text-green-600" />
                    WhatsApp
                </button>

                <button
                    type="button"
                    onClick={handleCopyLink}
                    className="btn-outline flex items-center gap-2"
                    aria-label="Copiar enlace del producto"
                >
                    {copied ? (
                        <IoCheckmarkOutline className="text-lg text-green-600" />
                    ) : (
                        <IoLinkOutline className="text-lg" />
                    )}
                    {copied ? "Copiado" : "Copiar link"}
                </button>
            </div>
        </div>
    );
};
