import { pgTable, uuid, text, timestamp, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'

export const units = pgTable('units', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: text('number').notNull(), // e.g., "R-001" a "R-086"
  label: text('label'), // nombre legible, e.g., "Rancho 1"
  isActive: boolean('is_active').notNull().default(true),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('unit_tenant_idx').on(table.tenantId),
  uniqueIndex('unit_tenant_number_idx').on(table.tenantId, table.number),
])
