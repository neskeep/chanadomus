import { pgTable, pgEnum, uuid, text, timestamp, numeric, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'
import { units } from './unit'

// Enums
export const recordTypeEnum = pgEnum('record_type', ['cargo', 'abono'])

// Financial Records
export const financialRecords = pgTable('financial_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  type: recordTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description').notNull(),
  date: timestamp('date').notNull(), // fecha del movimiento
  createdById: text('created_by_id').notNull().references(() => user.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('financial_tenant_idx').on(table.tenantId),
  index('financial_unit_idx').on(table.unitId),
  index('financial_tenant_unit_idx').on(table.tenantId, table.unitId),
  index('financial_date_idx').on(table.date),
])
