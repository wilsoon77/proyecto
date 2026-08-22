import { addDays } from '../common/time/business-date.js';

export const DEFAULT_EXPIRATION_ALERT_DAYS = [3] as const;

/**
 * Normaliza los recordatorios configurados en Product.
 * El resultado queda ordenado del aviso más anticipado al más cercano.
 */
export function normalizeExpirationAlertDays(value: unknown): number[] {
  const values = Array.isArray(value)
    ? value
    : value === undefined || value === null
      ? [...DEFAULT_EXPIRATION_ALERT_DAYS]
      : [value];

  const normalized = [...new Set(values
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 3650))];

  return normalized.length > 0
    ? normalized.sort((a, b) => b - a)
    : [...DEFAULT_EXPIRATION_ALERT_DAYS];
}

function dateKey(value: Date | string): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

/** Fecha del primer recordatorio de un lote según la configuración del producto. */
export function getDefaultExpirationAlertDate(
  expiresAt: Date | string | null | undefined,
  reminderDays: unknown,
): string | null {
  if (!expiresAt) return null;
  const days = normalizeExpirationAlertDays(reminderDays);
  return addDays(dateKey(expiresAt), -days[0]);
}

/**
 * alertAt también se utilizó históricamente para guardar la primera fecha
 * calculada del producto. Solo se considera personalizado si difiere de esa
 * fecha, lo que permite corregir datos existentes sin una migración destructiva.
 */
export function isCustomExpirationAlert(
  expiresAt: Date | string | null | undefined,
  alertAt: Date | string | null | undefined,
  reminderDays: unknown,
): boolean {
  if (!expiresAt || !alertAt) return false;
  return dateKey(alertAt) !== getDefaultExpirationAlertDate(expiresAt, reminderDays);
}
