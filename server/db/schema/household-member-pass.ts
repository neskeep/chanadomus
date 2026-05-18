import { pgTable, uuid, text, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { householdMembers } from './household'
import { units } from './unit'

export const householdMemberPasses = pgTable('household_member_passes', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => householdMembers.id),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  token: text('token').notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
  expiresAt: timestamp('expires_at'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('household_member_pass_token_idx').on(table.token),
  index('household_member_pass_member_idx').on(table.memberId),
  index('household_member_pass_tenant_idx').on(table.tenantId),
])
