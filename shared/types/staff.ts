export type StaffRole = 'conserje' | 'vigilancia' | 'mantenimiento' | 'otro'

export interface Staff {
  id: string
  name: string
  role: StaffRole
  roleId: string | null
  roleName: string | null
  idDocument: string | null
  phone: string | null
  email: string | null
  shift: string | null
  avatar: string | null
  qrToken: string | null
  isActive: boolean
  userId: string | null
  unitId: string | null
  unitNumber: string | null
  unitLabel: string | null
  tenantId: string
  createdAt: string
}
