/** Cuenta cuántas condiciones de filtro están activas (para el contador del botón Filtros). */
export function countActiveFilters(...conditions: boolean[]): number {
  return conditions.filter(Boolean).length
}
