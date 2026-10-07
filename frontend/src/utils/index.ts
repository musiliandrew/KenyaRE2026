import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKES(v: number, digits = 1): string {
  const a = Math.abs(v);
  if (a >= 1e9) return `KES ${(v / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `KES ${(v / 1e6).toFixed(digits)}M`;
  if (a >= 1e3) return `KES ${(v / 1e3).toFixed(0)}K`;
  return `KES ${v.toFixed(0)}`;
}

