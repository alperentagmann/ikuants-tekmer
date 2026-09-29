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

/**
 * Masks a phone number.
 * Example: '05321234567' -> '0532***4567'
 */
export function maskPhone(phone?: string | null): string {
  if (!phone || phone.length < 7) return '***';
  const start = phone.slice(0, 4);
  const end = phone.slice(-4);
  return `${start}***${end}`;
}

/**
 * Masks an email address.
 * Example: 'ahmet.yilmaz@example.com' -> 'ah***z@example.com'
 */
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return '***@***';
  const [username, domain] = email.split('@');
  if (username.length <= 2) return `${username[0]}*@${domain}`;
  return `${username.slice(0, 2)}***${username.slice(-1)}@${domain}`;
}

