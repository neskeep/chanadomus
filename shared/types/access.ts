import type { AccessDirection } from './qr'

export type EntryType = 'qr' | 'manual' | 'webhook' | 'evento'
export type AccessResult = 'allowed' | 'denied' | 'expired' | 'already_used'
export type DeviceStatus = 'active' | 'inactive'
export type ScanType = 'qr' | 'pin' | 'rfid'

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
}
