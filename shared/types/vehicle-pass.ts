export type VehiclePassType = 'resident' | 'guest'

export interface VehiclePass {
  id: string
  vehicleId: string
  token: string
  passType: VehiclePassType
  isActive: boolean
  issuedBy: string
  occupantLimit: number | null
  expiresAt: string | null
  notes: string | null
  createdAt: string
  deactivatedAt: string | null
  // Joined fields
  vehiclePlate?: string
  vehicleBrand?: string
  vehicleModel?: string
  vehicleColor?: string
  unitNumber?: string
  unitLabel?: string
}

export interface CreateVehiclePassInput {
  vehicleId: string
  passType: VehiclePassType
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
