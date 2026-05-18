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
  hasPass?: boolean
  passToken?: string
}

export interface VehiclePass {
  id: string
  vehicleId: string
  token: string
  passType: 'resident' | 'guest'
  isActive: boolean
  issuedBy: string
  occupantLimit: number | null
  expiresAt: string | null
  notes: string | null
  tenantId: string
  createdAt: string
}
