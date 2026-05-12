import { pgTable, uuid, text, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'
import { units } from './unit'

export const residentPasses = pgTable('resident_passes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  token: text('token').notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
  expiresAt: timestamp('expires_at').notNull(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('resident_pass_token_idx').on(table.token),
  index('resident_pass_user_idx').on(table.userId),
  index('resident_pass_tenant_idx').on(table.tenantId),
  index('resident_pass_tenant_user_idx').on(table.tenantId, table.userId),
])
