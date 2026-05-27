export type RecordType = 'cargo' | 'abono'
export type RecordCategory = 'ordinaria' | 'extraordinaria'

export interface FinancialRecord {
  id: string
  unitId: string
  type: RecordType
  category: RecordCategory
  amount: string // numeric viene como string de PG
  description: string
  date: string // ISO string
  createdById: string
  createdAt: string // ISO string
}

export interface AccountStatement {
  balance: string // saldo calculado
  records: FinancialRecord[]
}

export interface UnitSummary {
  unitId: string
  unitNumber: string
  unitLabel: string | null
  balance: string
  isInDebt: boolean
  lastMovementDate: string | null
}

export interface MovementWithUnit {
  id: string
  type: RecordType
  category: RecordCategory
  amount: string
  description: string
  date: string
  unitNumber: string
  unitLabel: string | null
  unitId: string
  createdAt: string
}

export interface FinancialReport {
  id: string
  title: string
  filePath: string
  month: number
  year: number
  uploadedById: string
  createdAt: string
}
