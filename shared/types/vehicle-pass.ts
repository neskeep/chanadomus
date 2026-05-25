export type VehiclePassType = 'resident' | 'guest' | 'temporary'

export interface VehiclePass {
  id: string
  vehicleId: string | null
  unitId: string | null
  token: string
  passType: VehiclePassType
  isActive: boolean
  issuedBy: string
  description: string | null
  occupantLimit: number | null
  expiresAt: string | null
  notes: string | null
  createdAt: string
  deactivatedAt: string | null
  // Joined fields
  vehiclePlate?: string | null
  vehicleBrand?: string | null
  vehicleModel?: string | null
  vehicleColor?: string | null
  unitNumber?: string | null
  unitLabel?: string | null
}

export interface CreateVehiclePassInput {
  vehicleId?: string
  unitId?: string
  passType: VehiclePassType
  description?: string
  occupantLimit?: number
  expiresAt?: string
  notes?: string
}

export interface UpdateVehiclePassInput {
  occupantLimit?: number | null
  expiresAt?: string | null
  notes?: string | null
  isActive?: boolean
}
