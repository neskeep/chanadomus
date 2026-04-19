export interface Vehicle {
  id: string
  unitId: string
  ownerMemberId: string | null
  plate: string
  brand: string
  model: string
  color: string
  tenantId: string
  createdAt: string
}
