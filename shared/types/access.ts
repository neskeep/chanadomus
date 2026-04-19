export type EntryType = 'qr' | 'manual' | 'webhook'
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
  createdAt: string
}
