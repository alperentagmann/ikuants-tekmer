import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Masks a Turkish National ID (T.C. Kimlik No) for display.
 * Example: '12345678901' -> '123******01'
 * Safe for both client and server use.
 */
export function maskTcNumber(tc?: string | null): string {
  if (!tc || tc.length < 11) return '***';
  return `${tc.slice(0, 3)}******${tc.slice(9, 11)}`;
}
