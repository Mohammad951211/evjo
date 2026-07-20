import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatJod(v: number, digits = 3): string {
  return v.toFixed(digits);
}

export function formatKm(v: number): string {
  return v < 10 ? v.toFixed(2) : Math.round(v).toString();
}
