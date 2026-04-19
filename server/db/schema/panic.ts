import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'
import { units } from './unit'

// Panic Events
export const panicEvents = pgTable('panic_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id),
  unitId: uuid('unit_id').references(() => units.id), // nullable — no todos los usuarios tienen unidad
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('panic_user_idx').on(table.userId),
  index('panic_tenant_idx').on(table.tenantId),
  index('panic_created_idx').on(table.createdAt),
])
