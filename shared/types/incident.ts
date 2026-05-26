export type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type IncidentPriority = 'low' | 'medium' | 'high'

export interface Incident {
  id: string
  title: string
  description: string
  priority: IncidentPriority
  status: IncidentStatus
  reportedById: string
  unitId: string
  unitNumber?: string // joined from units
  unitLabel?: string // joined from units
  reportedByName?: string // joined from users
  isAnonymous: boolean
  tenantId: string
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  photos?: IncidentPhoto[]
  updates?: IncidentUpdate[]
}

export interface IncidentPhoto {
  id: string
  incidentId: string
  filePath: string
  createdAt: string
}

export interface IncidentUpdate {
  id: string
  incidentId: string
  oldStatus: IncidentStatus
  newStatus: IncidentStatus
  note: string | null
  updatedById: string
  updatedByName?: string // joined from users
  createdAt: string
}
