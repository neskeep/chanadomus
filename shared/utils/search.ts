/**
 * Normalización de texto para búsquedas insensibles a mayúsculas y acentos.
 * Compartida entre cliente y servidor: el servidor la usa para preparar el
 * término antes de compararlo en SQL (ver server/utils/search.ts).
 */

const COMBINING_MARKS = /[̀-ͯ]/g

/** Quita diacríticos (á → a, ñ → n, ü → u) y pasa a minúsculas. */
export function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase()
}

/** true si `text` contiene `query`, ignorando mayúsculas, acentos y espacios de borde. */
export function matchesSearch(text: string, query: string): boolean {
  const q = normalizeSearchText(query.trim())
  if (!q) return true
  return normalizeSearchText(text).includes(q)
}
