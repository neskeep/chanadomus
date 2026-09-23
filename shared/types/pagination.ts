/** Meta de listas paginadas por página/límite. */
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  /** true si existe al menos una página más después de `page` */
  hasMore: boolean
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}
