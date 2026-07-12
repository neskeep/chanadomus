export const SUPPORT_TICKET_TYPES = ['bug', 'sugerencia', 'pregunta'] as const
export type SupportTicketType = (typeof SUPPORT_TICKET_TYPES)[number]

export const SUPPORT_TICKET_PRIORITIES = ['baja', 'media', 'alta', 'critica'] as const
export type SupportTicketPriority = (typeof SUPPORT_TICKET_PRIORITIES)[number]

export const SUPPORT_TICKET_STATUSES = ['nuevo', 'en_revision', 'en_desarrollo', 'resuelto', 'cerrado'] as const
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number]

export interface SupportTicket {
  id: string
  title: string
  description: string
  type: SupportTicketType
  priority: SupportTicketPriority
  status: SupportTicketStatus
  reportedById: string
  reportedByName?: string
  reportedByRole?: string
  pageUrl: string | null
  userAgent: string | null
  resolvedInVersion: string | null
  isPublic: boolean
  tenantId: string
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  screenshots?: SupportTicketScreenshot[]
  updates?: SupportTicketUpdate[]
}

export interface SupportTicketScreenshot {
  id: string
  ticketId: string
  filePath: string
  createdAt: string
}

export interface SupportTicketUpdate {
  id: string
  ticketId: string
  oldStatus: SupportTicketStatus
  newStatus: SupportTicketStatus
  note: string | null
  updatedById: string
  updatedByName?: string
  createdAt: string
}
