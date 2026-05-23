export type InvitationStatus = 'pending' | 'used' | 'expired' | 'revoked'

export interface Invitation {
  id: string
  token: string
  unitId: string
  unitNumber: string
  unitLabel: string | null
  role: 'propietario' | 'conserje'
  expiresAt: string
  usedAt: string | null
  revokedAt: string | null
  createdAt: string
  status: InvitationStatus
}

export interface InvitationLookup {
  status: InvitationStatus | 'invalid'
  unitNumber?: string
  unitLabel?: string | null
  role?: 'propietario' | 'conserje'
  expiresAt?: string
}

export interface RegisterPayload {
  name: string
  email: string
  phone?: string
  password: string
}
