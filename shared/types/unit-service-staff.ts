export interface ServiceStaffRole {
  id: string
  name: string
  tenantId: string
  createdAt: string
}

export interface UnitServiceStaff {
  id: string
  unitId: string
  name: string
  roleId: string
  roleName?: string
  idDocument: string | null
  phone: string | null
  isActive: boolean
  tenantId: string
  createdAt: string
  hasPass?: boolean
  passToken?: string
}

export interface ServiceStaffPass {
  id: string
  staffId: string
  unitId: string
  token: string
  isActive: boolean
  expiresAt: string | null
  tenantId: string
  createdAt: string
}

export interface StaffAttendanceLog {
  id: string
  result: 'allowed' | 'denied' | 'expired' | 'already_used'
  entryType: 'qr' | 'manual' | 'webhook'
  exitAt: string | null
  createdAt: string
  notes: string | null
}
