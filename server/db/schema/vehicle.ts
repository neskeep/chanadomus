import { pgTable, uuid, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { units } from './unit'
import { householdMembers } from './household'

// Vehicles
export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  ownerMemberId: uuid('owner_member_id').references(() => householdMembers.id),
  plate: text('plate').notNull(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  color: text('color').notNull(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('vehicle_tenant_idx').on(table.tenantId),
  index('vehicle_unit_idx').on(table.unitId),
  uniqueIndex('vehicle_tenant_plate_idx').on(table.tenantId, table.plate),
])
