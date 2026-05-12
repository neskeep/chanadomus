import type { VisitorType } from './qr'

export interface FrequentVisitor {
  id: string
  ownerId: string
  unitId: string
  visitorName: string
  visitorDocument: string | null
  visitorType: VisitorType
  vehiclePlate: string | null
  lastVisitAt: string | null
  visitCount: number
  createdAt: string
}

export interface CreateFrequentVisitor {
  visitorName: string
  visitorDocument?: string
  visitorType: VisitorType
  vehiclePlate?: string
  unitId: string
}

export interface UpdateFrequentVisitor {
  visitorName?: string
  visitorDocument?: string | null
  visitorType?: VisitorType
  vehiclePlate?: string | null
}
