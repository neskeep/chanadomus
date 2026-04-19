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
