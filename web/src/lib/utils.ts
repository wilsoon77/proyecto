import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { CURRENCY, LOCALE } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un precio en Quetzales (GTQ)
 * @param amount - Monto a formatear (puede ser número, string o Decimal de Prisma)
 * @returns String formateado "Q 25.50"
 */
export function formatPrice(amount: number | string | unknown): string {
  const num = typeof amount === 'number' ? amount : Number(amount)
  if (isNaN(num)) return `${CURRENCY.symbol} 0.00`
  return `${CURRENCY.symbol} ${num.toFixed(2)}`
}

/**
 * Alias de formatPrice para uso consistente en páginas admin.
 * Ambas funciones hacen exactamente lo mismo: Q 25.50
 */
export const formatCurrency = formatPrice

/**
 * Formatea una fecha Date en español guatemalteco
 * @param date - Fecha a formatear
 * @returns String formateado "11 de noviembre de 2025"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(LOCALE.language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d)
}

/**
 * Formatea una fecha ISO string en formato corto para tablas admin.
 * @param dateString - Fecha en formato ISO string (ej: "2025-11-11T10:30:00Z")
 * @returns String formateado "11/11/2025 10:30"
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(LOCALE.language, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Formatea una fecha ISO string con opciones de Intl personalizadas.
 * Centraliza formatDate para admin pages que necesitan variantes.
 */
export function formatDateString(
  dateString: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(
    LOCALE.language,
    options ?? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  ).format(date)
}

/**
 * Formato corto para ejes de gráficas del dashboard: "Lun 5"
 */
export function formatDateChart(dateString: string): string {
  return formatDateString(dateString, { weekday: 'short', day: 'numeric' })
}

