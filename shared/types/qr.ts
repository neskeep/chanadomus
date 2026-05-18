export type VisitorType = 'invitado' | 'proveedor'
export type QrStatus = 'active' | 'used' | 'expired'
export type ValidationStatus = 'valid' | 'expired' | 'already_used' | 'invalid'
export type AccessDirection = 'entry' | 'exit'

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
  frequentVisitorId?: string
}

export interface ValidationResult {
  status: ValidationStatus
  /** Whether this scan was an entry or exit */
  direction?: AccessDirection
  /** Access log ID (present on exit to identify which entry was closed) */
  accessLogId?: string
  visitorName?: string
  visitorDocument?: string | null
  visitorType?: VisitorType
  unitNumber?: string
  unitLabel?: string | null
  expiresAt?: string
  usedAt?: string | null
  /** Indicates this was a resident pass (multi-use) */
  isResidentPass?: boolean
  /** Resident name when validated via resident pass */
  residentName?: string
  /** Indicates this was a vehicle pass */
  isVehiclePass?: boolean
  /** Vehicle data when validated via vehicle pass */
  vehiclePlate?: string
  vehicleBrand?: string
  vehicleModel?: string
  vehicleColor?: string
  /** Vehicle pass type: resident or guest */
  passType?: string
  /** Max occupants allowed, null = unlimited */
  occupantLimit?: number | null
  /** Indicates this was a service staff pass */
  isStaffPass?: boolean
  /** Staff member name */
  staffName?: string
  /** Staff role name */
  staffRole?: string
  /** Indicates this was a condo staff pass (personal del condominio) */
  isCondoStaff?: boolean
  /** Indicates this was a household member pass */
  isMemberPass?: boolean
  /** Household member name */
  memberName?: string
  /** Household member relationship */
  memberRelationship?: string
}
