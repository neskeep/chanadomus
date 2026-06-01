export type AnnouncementCategory = 'general' | 'mantenimiento' | 'seguridad' | 'financiero' | 'evento' | 'urgente'
export type AnnouncementStatus = 'draft' | 'published' | 'archived'

export interface Announcement {
  id: string
  title: string
  body: string
  category: AnnouncementCategory
  status: AnnouncementStatus
  attachmentPath: string | null
  authorId: string
  authorName?: string // joined from users
  tenantId: string
  publishedAt: string | null
  expiresAt: string | null
  displayOrder: number
  createdAt: string
  updatedAt: string
}
