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

// VehiclePass is defined in shared/types/vehicle-pass.ts
