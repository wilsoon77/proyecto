import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { CURRENCY, LOCALE } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un precio en Quetzales (GTQ)
 * @param amount - Monto a formatear
 * @returns String formateado "Q 25.50"
 */
export function formatPrice(amount: number): string {
  return `${CURRENCY.symbol} ${amount.toFixed(2)}`
}

/**
 * Formatea una fecha en español guatemalteco
 * @param date - Fecha a formatear
 * @returns String formateado "11 de noviembre de 2025"
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE.language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}
