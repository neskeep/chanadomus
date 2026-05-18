import { pgTable, uuid, text, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { unitServiceStaff } from './unit-service-staff'
import { units } from './unit'

export const serviceStaffPasses = pgTable('service_staff_passes', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').notNull().references(() => unitServiceStaff.id),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  token: text('token').notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
  expiresAt: timestamp('expires_at'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('service_staff_pass_token_idx').on(table.token),
  index('service_staff_pass_staff_idx').on(table.staffId),
  index('service_staff_pass_tenant_idx').on(table.tenantId),
])
