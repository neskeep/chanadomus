export type EventStatus = 'pendiente' | 'activo' | 'completado' | 'cancelado'
export type GuestStatus = 'pendiente' | 'dentro' | 'salio'

export interface EventSummary {
  id: string
  title: string
  description: string | null
  unitId: string
  unitNumber: string | null
  unitLabel: string | null
  createdById: string
  createdByName: string | null
  status: EventStatus
  startsAt: string
  endsAt: string
  guestLimit: number | null
  notes: string | null
  guestCount: number
  guestsInside: number
  guestsExited: number
  createdAt: string
}

export interface EventDetail extends EventSummary {
  approvedById: string | null
  approvedByName: string | null
  approvedAt: string | null
  updatedAt: string
}

export interface EventGuest {
  id: string
  eventId: string
  name: string
  document: string | null
  vehiclePlate: string | null
  status: GuestStatus
  checkedInAt: string | null
  checkedOutAt: string | null
  checkedInBy: string | null
  checkedInByName: string | null
  checkedOutBy: string | null
  checkedOutByName: string | null
  createdAt: string
}

export interface CreateEvent {
  title: string
  description?: string
  unitId?: string
  startsAt: string
  endsAt: string
  guestLimit?: number
  notes?: string
}

export interface UpdateEvent {
  title?: string
  description?: string
  startsAt?: string
  endsAt?: string
  guestLimit?: number | null
  notes?: string
}

export interface CreateGuest {
  name: string
  document?: string
  vehiclePlate?: string
}

export interface BulkImportResult {
  added: number
  duplicates: number
  errors: string[]
}

export const EVENT_STATUSES: { key: EventStatus; label: string }[] = [
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'activo', label: 'Activo' },
  { key: 'completado', label: 'Completado' },
  { key: 'cancelado', label: 'Cancelado' },
]

export const GUEST_STATUSES: { key: GuestStatus; label: string }[] = [
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'dentro', label: 'Dentro' },
  { key: 'salio', label: 'Salió' },
]
