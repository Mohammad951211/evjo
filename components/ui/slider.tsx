"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onValueChange?: (v: number) => void;
}

/** Styled native range input with the brand accent. */
const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, onValueChange, ...props }, ref) => (
    <input
      ref={ref}
      type="range"
      onChange={(e) => onValueChange?.(Number(e.target.value))}
      className={cn("h-2 w-full cursor-pointer accent-[#1B7A4B]", className)}
      {...props}
    />
  )
);
Slider.displayName = "Slider";

export { Slider };
