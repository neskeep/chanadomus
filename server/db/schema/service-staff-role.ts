import { pgTable, uuid, text, timestamp, boolean, integer, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'

// Catálogo de roles de personal de servicio (gestionado por admin)
// Usado por: unit_service_staff (personal por unidad) y staff (personal condominial)
export const serviceStaffRoles = pgTable('service_staff_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  appliesToStaff: boolean('applies_to_staff').notNull().default(true),
  appliesToProviders: boolean('applies_to_providers').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('service_staff_roles_tenant_idx').on(table.tenantId),
  uniqueIndex('service_staff_roles_name_tenant_idx').on(table.tenantId, table.name),
])
