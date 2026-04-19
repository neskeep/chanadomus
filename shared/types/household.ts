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
}
