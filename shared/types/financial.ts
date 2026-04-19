export type RecordType = 'cargo' | 'abono'

export interface FinancialRecord {
  id: string
  unitId: string
  type: RecordType
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
