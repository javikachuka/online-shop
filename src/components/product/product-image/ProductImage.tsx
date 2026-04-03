import Image from "next/image";

interface Props {
    src?: string;
    alt: string;
    className?: React.HTMLAttributes<HTMLImageElement>['className'];
    width?: number;
    height?: number;
    fill?: boolean;
    sizes?: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export const ProductImage = ({
    src,
    alt,
    className,
    width,
    height,
    fill = false,
    sizes,
    onMouseEnter,
    onMouseLeave
}: Props) => {
    
    const finalSrc = (src && typeof src === 'string')
        ? src.startsWith('http') || src.startsWith('blob')
            ? src 
            : `/products/${src}`
        : '/imgs/no-image.jpg';

    if (fill) {
        return (
            <Image 
                src={finalSrc} 
                alt={alt} 
                className={className}
                fill
                sizes={sizes}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            />
        )
    }

    return (
        <Image 
            src={finalSrc} 
            alt={alt} 
            className={className} 
            width={width || 300} 
            height={height || 300}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        />
    )
    
};
