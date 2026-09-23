import { sql, type SQL, type SQLWrapper } from 'drizzle-orm'
import { normalizeSearchText } from '~~/shared/utils/search'

/**
 * Pares de `translate()` para quitar acentos en Postgres sin la extensión unaccent.
 * Se aplica sobre `lower(col)`; las mayúsculas acentuadas se incluyen por si la
 * collation de la base no las convierte con lower().
 */
const ACCENTED = 'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ'
const PLAIN = 'aaaaaeeeeiiiiooooouuuuncaaaaaeeeeiiiiooooouuuunc'

/** Escapa los comodines de LIKE (`\`, `%`, `_`) para buscar el término literal. */
export function escapeLikePattern(term: string): string {
  return term.replace(/[\\%_]/g, '\\$&')
}

/** Patrón `%termino%` normalizado (minúsculas, sin acentos) y escapado. */
export function buildSearchPattern(term: string): string {
  return `%${escapeLikePattern(normalizeSearchText(term.trim()))}%`
}

/** Expresión SQL de la columna en minúsculas y sin acentos. */
export function unaccentLower(column: SQLWrapper): SQL {
  return sql`translate(lower(${column}), ${ACCENTED}, ${PLAIN})`
}

/**
 * Condición "contiene" insensible a mayúsculas y acentos.
 * Recibe el patrón ya construido con `buildSearchPattern` para reutilizarlo en
 * varias columnas de un mismo `or(...)`.
 */
export function searchContains(column: SQLWrapper, pattern: string): SQL {
  return sql`${unaccentLower(column)} like ${pattern}`
}
