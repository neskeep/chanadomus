export interface ResidentPass {
  id: string
  userId: string
  unitId: string | null
  token: string
  isActive: boolean
  expiresAt: string
  createdAt: string
  updatedAt: string
}
