"use client";

import { useEffect } from "react";
import { IoAddCircleOutline, IoRemoveCircleOutline } from "react-icons/io5";

interface Props {
    quantity: number;
    maxQuantity?: number;
    disabled?: boolean;
    onQuantityChanged: (value: number) => void;
}

export const QuantitySelector = ({
    quantity,
    maxQuantity,
    disabled = false,
    onQuantityChanged,
}: Props) => {

    const onValueChanged = (value: number) => {
        if (disabled) return;

        if (quantity + value < 1) return;

        if (maxQuantity) {
            if (quantity + value > maxQuantity) return;
        }
        
        onQuantityChanged(quantity + value);
    };
    return (
        <div className="flex mt-2 mb-2 md:mt-5 md:mb-5">
            <button onClick={() => onValueChanged(-1)} disabled={disabled} className={disabled ? 'opacity-40 cursor-not-allowed' : ''}>
                <IoRemoveCircleOutline size={30} />
            </button>
            <span className={`w-20 mx-3 px-5 text-center rounded ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-gray-200'}`}>
                {quantity}
            </span>
            <button onClick={() => onValueChanged(1)} disabled={disabled} className={disabled ? 'opacity-40 cursor-not-allowed' : ''}>
                <IoAddCircleOutline size={30} />
            </button>
        </div>
    );
};
