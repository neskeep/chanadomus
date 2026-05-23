import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'
import { units } from './unit'

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: text('token').notNull().unique(),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  role: text('role').notNull(),
  createdById: text('created_by_id').notNull().references(() => user.id),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('invitation_token_idx').on(table.token),
  index('invitation_unit_idx').on(table.unitId),
  index('invitation_tenant_idx').on(table.tenantId),
])
