import { pgTable, uuid, text, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { units } from './unit'
import { serviceStaffRoles } from './service-staff-role'

// Personal de servicio por unidad
export const unitServiceStaff = pgTable('unit_service_staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  name: text('name').notNull(),
  roleId: uuid('role_id').notNull().references(() => serviceStaffRoles.id),
  idDocument: text('id_document'),
  phone: text('phone'),
  isActive: boolean('is_active').notNull().default(true),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('unit_service_staff_tenant_idx').on(table.tenantId),
  index('unit_service_staff_unit_idx').on(table.unitId),
])
