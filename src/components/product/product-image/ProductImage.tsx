import Image from "next/image";

interface Props {
    src?: string;
    alt: string;
    className?: React.HTMLAttributes<HTMLImageElement>['className'];
    width?: number;
    height?: number;
    fill?: boolean;
    sizes?: string;
    priority?: boolean;
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
    priority = false,
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
                sizes={sizes || '(max-width: 768px) 50vw, 33vw'}
                priority={priority}
                loading={priority ? undefined : 'lazy'}
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
            sizes={sizes || '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'}
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        />
    )
    
};
