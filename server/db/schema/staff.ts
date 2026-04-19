import { pgTable, pgEnum, uuid, text, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'

// Enums
export const staffRoleEnum = pgEnum('staff_role', ['conserje', 'vigilancia', 'mantenimiento', 'otro'])

// Staff
export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  role: staffRoleEnum('role').notNull(),
  idDocument: text('id_document'),
  phone: text('phone'),
  email: text('email'),
  shift: text('shift'),
  isActive: boolean('is_active').notNull().default(true),
  userId: text('user_id').references(() => user.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('staff_tenant_idx').on(table.tenantId),
  index('staff_role_idx').on(table.role),
])
