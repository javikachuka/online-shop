"use client";

import { useEffect } from "react";
import { IoAddCircleOutline, IoRemoveCircleOutline } from "react-icons/io5";

interface Props {
    quantity: number;
    maxQuantity?: number;
    onQuantityChanged: (value: number) => void;
}

export const QuantitySelector = ({
    quantity,
    maxQuantity,
    onQuantityChanged,
}: Props) => {

    const onValueChanged = (value: number) => {
        if (quantity + value < 1) return;

        if (maxQuantity) {
            if (quantity + value > maxQuantity) return;
        }
        
        onQuantityChanged(quantity + value);
    };
    return (
        <div className="flex mt-2 mb-2 md:mt-5 md:mb-5">
            <button onClick={() => onValueChanged(-1)}>
                <IoRemoveCircleOutline size={30} />
            </button>
            <span className="w-20 mx-3 px-5 bg-gray-200 text-center rounded">
                {quantity}
            </span>
            <button onClick={() => onValueChanged(1)}>
                <IoAddCircleOutline size={30} />
            </button>
        </div>
    );
};
