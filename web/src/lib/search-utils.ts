/**
 * Normaliza texto para busqueda eliminando acentos/tildes, diacriticos y convirtiendo a minusculas.
 * Ej: "Pan Francés" -> "pan frances", "Café" -> "cafe", "Azúcar" -> "azucar", "Pequeña" -> "pequena"
 */
export function normalizeSearchText(text?: string | null): string {
  if (!text) return ""
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .trim()
}

/**
 * Comprueba si el texto objetivo incluye la consulta de busqueda ignorando mayusculas y tildes/acentos.
 */
export function searchMatches(target?: string | null, query?: string | null): boolean {
  if (!query || !query.trim()) return true
  if (!target) return false
  return normalizeSearchText(target).includes(normalizeSearchText(query))
}
