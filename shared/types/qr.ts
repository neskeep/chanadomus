export type VisitorType = 'invitado' | 'proveedor'
export type QrStatus = 'active' | 'used' | 'expired'
export type ValidationStatus = 'valid' | 'expired' | 'already_used' | 'invalid'

export interface QrCodeRecord {
  id: string
  token: string
  visitorName: string
  visitorDocument: string | null
  visitorType: VisitorType
  unitId: string
  unitNumber: string
  unitLabel: string | null
  expiresAt: string
  usedAt: string | null
  createdAt: string
  status: QrStatus
}

export interface GenerateQrInput {
  visitorName: string
  visitorDocument?: string
  visitorType: VisitorType
  unitId: string
  expiresAt: string
}

export interface ValidationResult {
  status: ValidationStatus
  visitorName?: string
  visitorDocument?: string | null
  visitorType?: VisitorType
  unitNumber?: string
  unitLabel?: string | null
  expiresAt?: string
  usedAt?: string | null
}
