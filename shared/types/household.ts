export type HouseholdRelationship = 'owner' | 'spouse' | 'child' | 'tenant' | 'other'

export interface HouseholdMember {
  id: string
  unitId: string
  name: string
  relationship: HouseholdRelationship
  idDocument: string | null
  phone: string | null
  isActive: boolean
  tenantId: string
  createdAt: string
  hasPass?: boolean
  passToken?: string
}

export interface HouseholdMemberPass {
  id: string
  memberId: string
  unitId: string
  token: string
  isActive: boolean
  expiresAt: string | null
  tenantId: string
  createdAt: string
}
