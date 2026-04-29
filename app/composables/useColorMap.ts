import type { AnnouncementCategory, AnnouncementStatus } from '~~/shared/types/announcement'
import type { ChatRoomType } from '~~/shared/types/chat'
import type { IncidentPriority, IncidentStatus } from '~~/shared/types/incident'
import type { MeetingStatus, MeetingType } from '~~/shared/types/meeting'
import type { PollStatus } from '~~/shared/types/poll'
import type { ProviderCategory, ProviderStatus } from '~~/shared/types/provider'
import type { ValidationStatus } from '~~/shared/types/qr'

// ─── Incident ────────────────────────────────────────────
export const INCIDENT_STATUS_COLORS: Record<IncidentStatus, string> = {
  open: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-zinc-100 text-zinc-600',
}

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  open: 'Abierta',
  in_progress: 'En proceso',
  resolved: 'Resuelta',
  closed: 'Cerrada',
}

export const INCIDENT_PRIORITY_COLORS: Record<IncidentPriority, string> = {
  low: 'bg-zinc-100 text-zinc-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
}

export const INCIDENT_PRIORITY_LABELS: Record<IncidentPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
}

// ─── Announcement ────────────────────────────────────────
export const ANNOUNCEMENT_CATEGORY_COLORS: Record<AnnouncementCategory, string> = {
  general: 'bg-blue-100 text-blue-800',
  mantenimiento: 'bg-amber-100 text-amber-800',
  seguridad: 'bg-red-100 text-red-800',
  financiero: 'bg-emerald-100 text-emerald-800',
  evento: 'bg-purple-100 text-purple-800',
  urgente: 'bg-red-200 text-red-900',
}

export const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  general: 'General',
  mantenimiento: 'Mantenimiento',
  seguridad: 'Seguridad',
  financiero: 'Financiero',
  evento: 'Evento',
  urgente: 'Urgente',
}

export const ANNOUNCEMENT_STATUS_COLORS: Record<AnnouncementStatus, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-zinc-100 text-zinc-500',
}

export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado',
}

// ─── Provider ────────────────────────────────────────────
export const PROVIDER_CATEGORY_COLORS: Record<ProviderCategory, string> = {
  plomeria: 'bg-blue-100 text-blue-700',
  electricidad: 'bg-yellow-100 text-yellow-700',
  jardineria: 'bg-green-100 text-green-700',
  cerrajeria: 'bg-gray-100 text-gray-700',
  limpieza: 'bg-cyan-100 text-cyan-700',
  pintura: 'bg-purple-100 text-purple-700',
  albanileria: 'bg-orange-100 text-orange-700',
  seguridad: 'bg-red-100 text-red-700',
  fumigacion: 'bg-emerald-100 text-emerald-700',
  otro: 'bg-slate-100 text-slate-700',
}

export const PROVIDER_STATUS_COLORS: Record<ProviderStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-zinc-100 text-zinc-600',
  pending: 'bg-amber-100 text-amber-800',
}

export const PROVIDER_STATUS_LABELS: Record<ProviderStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  pending: 'Pendiente',
}

// ─── Meeting ─────────────────────────────────────────────
export const MEETING_TYPE_COLORS: Record<MeetingType, string> = {
  ordinaria: 'bg-blue-100 text-blue-700',
  extraordinaria: 'bg-amber-100 text-amber-700',
  comite: 'bg-purple-100 text-purple-700',
  informativa: 'bg-cyan-100 text-cyan-700',
}

export const MEETING_STATUS_COLORS: Record<MeetingStatus, string> = {
  programada: 'bg-blue-100 text-blue-700',
  en_curso: 'bg-emerald-100 text-emerald-700',
  completada: 'bg-zinc-100 text-zinc-600',
  cancelada: 'bg-red-100 text-red-700',
}

// ─── Poll ────────────────────────────────────────────────
export const POLL_STATUS_COLORS: Record<PollStatus, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  active: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-blue-100 text-blue-800',
}

export const POLL_STATUS_LABELS: Record<PollStatus, string> = {
  draft: 'Borrador',
  active: 'Activa',
  closed: 'Cerrada',
}

// ─── QR / Validation ────────────────────────────────────
export const VALIDATION_STATUS_COLORS: Record<ValidationStatus, { bg: string; icon: string; accent: string }> = {
  valid: { bg: 'bg-green-500', icon: 'text-green-500', accent: 'ring-green-500/30' },
  expired: { bg: 'bg-amber-500', icon: 'text-amber-500', accent: 'ring-amber-500/30' },
  already_used: { bg: 'bg-amber-500', icon: 'text-amber-500', accent: 'ring-amber-500/30' },
  invalid: { bg: 'bg-red-500', icon: 'text-red-500', accent: 'ring-red-500/30' },
}

export const VALIDATION_STATUS_LABELS: Record<ValidationStatus, string> = {
  valid: 'Acceso autorizado',
  expired: 'Código expirado',
  already_used: 'Código ya utilizado',
  invalid: 'Código inválido',
}

// ─── Access Page ─────────────────────────────────────────
export const ACCESS_STATUS_COLORS = {
  valid: { iconColor: 'text-green-500', borderColor: 'border-green-500' },
  expired: { iconColor: 'text-amber-500', borderColor: 'border-amber-500' },
  already_used: { iconColor: 'text-blue-500', borderColor: 'border-blue-500' },
  invalid: { iconColor: 'text-red-500', borderColor: 'border-red-500' },
} as const

// ─── Chat ────────────────────────────────────────────────
export const CHAT_CHANNEL_COLORS: Record<ChatRoomType, { iconBg: string; iconColor: string }> = {
  general: { iconBg: 'bg-amber-100', iconColor: 'text-amber-700' },
  unit: { iconBg: 'bg-purple-100', iconColor: 'text-purple-700' },
  vigilancia: { iconBg: 'bg-blue-100', iconColor: 'text-blue-700' },
  admin: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700' },
}

// ─── Dashboard Icon Backgrounds ──────────────────────────
export const ICON_BG = {
  teal: 'bg-[--icon-bg-teal] text-primary',
  orange: 'bg-[--icon-bg-orange] text-secondary',
  yellow: 'bg-[--icon-bg-yellow] text-amber-600',
  info: 'bg-blue-100 text-blue-600',
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  danger: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
} as const

// ─── Trend Indicators ───────────────────────────────────
export const TREND_COLORS = {
  positive: { icon: 'text-emerald-500', text: 'text-emerald-600' },
  negative: { icon: 'text-red-500', text: 'text-red-600' },
} as const
