import { pgTable, uuid, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'

// Catálogo de roles de personal de servicio (gestionado por admin)
export const serviceStaffRoles = pgTable('service_staff_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('service_staff_roles_tenant_idx').on(table.tenantId),
  uniqueIndex('service_staff_roles_name_tenant_idx').on(table.tenantId, table.name),
])
