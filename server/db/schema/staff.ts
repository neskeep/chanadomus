import { pgTable, pgEnum, uuid, text, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'
import { units } from './unit'
import { serviceStaffRoles } from './service-staff-role'

// Enums (legacy — kept for backward compat, new records use roleId)
export const staffRoleEnum = pgEnum('staff_role', ['conserje', 'vigilancia', 'mantenimiento', 'otro'])

// Staff
export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  role: staffRoleEnum('role').notNull(),
  roleId: uuid('role_id').references(() => serviceStaffRoles.id),
  idDocument: text('id_document'),
  phone: text('phone'),
  email: text('email'),
  shift: text('shift'),
  isActive: boolean('is_active').notNull().default(true),
  avatar: text('avatar'),
  qrToken: text('qr_token').unique(),
  userId: text('user_id').references(() => user.id),
  unitId: uuid('unit_id').references(() => units.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('staff_tenant_idx').on(table.tenantId),
  index('staff_role_idx').on(table.role),
  index('staff_role_id_idx').on(table.roleId),
  index('staff_qr_token_idx').on(table.qrToken),
  index('staff_unit_idx').on(table.unitId),
])
