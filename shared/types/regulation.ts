export type RegulationCategory = 'normas' | 'horarios' | 'arquitectura'

export interface Regulation {
  id: string
  title: string
  category: RegulationCategory
  attachmentPath: string
  authorId: string
  authorName?: string
  tenantId: string
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export const REGULATION_CATEGORY_LABELS: Record<RegulationCategory, string> = {
  normas: 'Normas de Convivencia',
  horarios: 'Horarios',
  arquitectura: 'Reglas Arquitectónicas',
}
