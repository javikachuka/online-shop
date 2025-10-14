import type { Size } from "@/interfaces"

interface Props {
    selectedSize?: Size
    availableSizes: Size[]
    onSizeChanged: (size: Size) => void
}


export const SideSelector = ({selectedSize, availableSizes, onSizeChanged}: Props) => {

  return (
    <div className="my-5">
        <h3 className="font-bold mb-4">
            Tallas disponibles
        </h3>
        <div className="flex">
            {
                availableSizes.map(size => (
                    <button
                        key={size}
                        onClick={() => onSizeChanged(size)}
                        className={`mx-2 hover:underline text-lg ${size === selectedSize ? 'underline' : ''}`}
                    >
                        {size}
                    </button>
                ))
            }
        </div>
    </div>
  )
}
