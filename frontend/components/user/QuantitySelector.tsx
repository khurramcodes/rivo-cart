"use client";

import { Minus, Plus } from "lucide-react";

type QuantitySelectorProps = {
    value: number;
    min?: number;
    max?: number;
    onChange: (value: number) => void;

    gapClassName?: string;
    buttonSizeClassName?: string;
    containerClassName?: string;
    buttonClassName?: string;
    valueClassName?: string;
    valueSizeClassName?: string;
};

const BASE_CONTAINER = "inline-flex items-center";
const BASE_BUTTON = "flex items-center justify-center border";
const BASE_VALUE = "min-w-12 text-center font-medium";
const DEFAULT_GAP = "gap-3";
const DEFAULT_BUTTON_SIZE = "";
const DEFAULT_BUTTON_CLASS = "text-zinc-900";
const DEFAULT_VALUE_CLASS = "text-zinc-900";
const DEFAULT_VALUE_SIZE = "text-lg";


export function QuantitySelector({
    value,
    min = 1,
    max = Infinity,
    onChange,

    gapClassName,
    buttonSizeClassName,
    buttonClassName,
    containerClassName,
    valueClassName,
    valueSizeClassName,
}: QuantitySelectorProps) {
    return (
        <div
            className={`${BASE_CONTAINER} ${DEFAULT_GAP} ${gapClassName ?? ""} ${containerClassName ?? ""}`}
        >
            <button
                onClick={() => value > min && onChange(value - 1)}
                disabled={value <= min}
                className={`${BASE_BUTTON} ${DEFAULT_BUTTON_SIZE} ${buttonSizeClassName ?? ""} ${DEFAULT_BUTTON_CLASS} ${buttonClassName ?? ""}`}
            >
                <Minus className="h-4 w-4" />
            </button>

            <span
                className={`${BASE_VALUE} ${DEFAULT_VALUE_SIZE} ${valueSizeClassName ?? ""} ${DEFAULT_VALUE_CLASS} ${valueClassName ?? ""}`}
            >
                {value}
            </span>

            <button
                onClick={() => value < max && onChange(value + 1)}
                disabled={value >= max}
                className={`${BASE_BUTTON} ${DEFAULT_BUTTON_SIZE} ${buttonSizeClassName ?? ""} ${DEFAULT_BUTTON_CLASS} ${buttonClassName ?? ""}`}
            >
                <Plus className="h-4 w-4" />
            </button>
        </div>
    );
}
