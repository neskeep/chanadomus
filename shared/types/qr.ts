export type VisitorType = 'invitado' | 'proveedor'
export type QrStatus = 'active' | 'used' | 'expired' | 'canceled'
export type ValidationStatus = 'valid' | 'expired' | 'already_used' | 'already_inside' | 'invalid' | 'canceled'
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
  canceledAt: string | null
  createdAt: string
  status: QrStatus
}

export interface GenerateQrInput {
  visitorName: string
  visitorDocument?: string
  visitorType: VisitorType
  unitId: string
  expiresAt: string
  multiUse?: boolean
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
  unitNumber?: string | null
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
  vehiclePlate?: string | null
  vehicleBrand?: string | null
  vehicleModel?: string | null
  vehicleColor?: string | null
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
  /** Timestamp of the existing open entry (for already_inside status) */
  entryAt?: string
  /** Indicates this was a household member pass */
  isMemberPass?: boolean
  /** Household member name */
  memberName?: string
  /** Household member relationship */
  memberRelationship?: string
  /** When true, the guard must assign a unit before confirming the access */
  requiresUnit?: boolean
  /** Vehicle pass ID (needed for unit assignment) */
  vehiclePassId?: string
}
