/**
 * Paginación por página/límite (offset). Puro: sirve en server y client.
 */
import { z } from 'zod'

export function paginationQuerySchema(defaultLimit: number, maxLimit: number) {
  return z.object({
    page: z.coerce.number().int('page debe ser un entero').min(1, 'page debe ser mayor o igual a 1').default(1),
    limit: z.coerce.number()
      .int('limit debe ser un entero')
      .min(1, 'limit debe ser mayor o igual a 1')
      .max(maxLimit, `limit no puede superar ${maxLimit}`)
      .default(defaultLimit),
  })
}

export function pageOffset(page: number, limit: number): number {
  return (Math.max(1, page) - 1) * limit
}

export function hasMorePages(page: number, limit: number, total: number): boolean {
  return page * limit < total
}
