/**
 * Genera un slug URL-safe a partir de un texto.
 * - Elimina emojis y caracteres especiales
 * - Convierte a minúsculas
 * - Reemplaza espacios y separadores por guiones
 * - Solo permite letras a-z, dígitos 0-9 y guiones
 */
export function generateSlug(text: string): string {
  return text
    // Remove emoji and other non-BMP characters
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    // Normalize accents (e.g. é → e)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Lowercase
    .toLowerCase()
    // Replace spaces and common separators with hyphens
    .replace(/[\s_]+/g, '-')
    // Keep only alphanumeric + hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Collapse multiple hyphens
    .replace(/-{2,}/g, '-')
    // Trim leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}
