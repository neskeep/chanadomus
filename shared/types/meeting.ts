export type MeetingType = 'ordinaria' | 'extraordinaria' | 'comite' | 'informativa'
export type MeetingStatus = 'programada' | 'en_curso' | 'completada' | 'cancelada'

export interface Meeting {
  id: string
  title: string
  description: string | null
  date: string
  endDate: string | null
  location: string | null
  meetingLink: string | null
  type: MeetingType
  status: MeetingStatus
  agenda: string | null
  minutes: string | null
  createdById: string
  createdByName?: string
  tenantId: string
  createdAt: string
  updatedAt: string
}

export interface CreateMeeting {
  title: string
  description?: string
  date: string
  endDate?: string
  location?: string
  meetingLink?: string
  type: MeetingType
  agenda?: string
}

export interface UpdateMeeting {
  title?: string
  description?: string
  date?: string
  endDate?: string
  location?: string
  meetingLink?: string
  type?: MeetingType
  status?: MeetingStatus
  agenda?: string
  minutes?: string
}

export const MEETING_TYPES: { key: MeetingType; label: string }[] = [
  { key: 'ordinaria', label: 'Ordinaria' },
  { key: 'extraordinaria', label: 'Extraordinaria' },
  { key: 'comite', label: 'Comité' },
  { key: 'informativa', label: 'Informativa' },
]

export const MEETING_STATUSES: { key: MeetingStatus; label: string }[] = [
  { key: 'programada', label: 'Programada' },
  { key: 'en_curso', label: 'En Curso' },
  { key: 'completada', label: 'Completada' },
  { key: 'cancelada', label: 'Cancelada' },
]
