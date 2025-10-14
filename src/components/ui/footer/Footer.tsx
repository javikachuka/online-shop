import { titleFont } from "@/config/fonts"
import Link from "next/link"

export const Footer = () => {
  return (
    <div className="flex w-full justify-center text-xs mb-10 mt-2">
        <Link
            href={'/'}
            className="mx-3"
        >
            <span className={`${titleFont.className} antialiased font-bold`}>APP</span>
            <span> | shop </span>
            <span>@ {new Date().getFullYear()}</span>
        </Link>

        <Link
            href={'/'}
            className="mx-3"
        >
            Privacidad & Legales
        </Link>
        <Link
            href={'/'}
            className="mx-3"
        >
            Ubicaciones
        </Link>

    </div>
  )
}
