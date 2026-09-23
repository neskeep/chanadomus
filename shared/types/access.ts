import type { AccessDirection } from './qr'

export type AccessLogKind = 'entry' | 'exit_only'

export type EntryType = 'qr' | 'manual' | 'webhook' | 'evento'
export type AccessResult = 'allowed' | 'denied' | 'expired' | 'already_used'
export type DeviceStatus = 'active' | 'inactive'
export type ScanType = 'qr' | 'pin' | 'rfid'

/** Rango de GET /api/my-unit/access-history, en días locales del condominio */
export type UnitAccessRange = 'today' | '7d' | '30d'

export interface UnitAccessHistoryMeta {
  total: number
  page: number
  limit: number
  hasMore: boolean
  range: UnitAccessRange
  /** Primer día local incluido (YYYY-MM-DD) */
  from: string
  /** Último día local incluido (YYYY-MM-DD), hoy */
  to: string
}

export interface WebhookScanPayload {
  type: ScanType
  value: string // token QR, PIN, o RFID tag
  timestamp?: string // ISO 8601, opcional — usa server time si no viene
}

export interface AccessEvent {
  id: string
  entryType: EntryType
  result: AccessResult
  visitorName: string | null
  visitorDocument: string | null
  unitNumber: string | null
  unitLabel: string | null
  notes: string | null
  exitAt: string | null
  createdAt: string
  vehiclePassId?: string | null
  staffPassId?: string | null
  occupantCount?: number | null
  vehiclePlate?: string | null
  eventId?: string | null
  eventTitle?: string | null
  /** Whether this event was an entry or exit scan */
  direction?: AccessDirection
  /**
   * 'exit_only' = exit registered without an open entry (exit_at ≈ created_at).
   * Only set by history endpoints for staff views.
   */
  kind?: AccessLogKind
}
