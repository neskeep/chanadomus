export type StaffRole = 'conserje' | 'vigilancia' | 'mantenimiento' | 'otro'

export interface Staff {
  id: string
  name: string
  role: StaffRole
  idDocument: string | null
  phone: string | null
  email: string | null
  shift: string | null
  isActive: boolean
  userId: string | null
  tenantId: string
  createdAt: string
}
