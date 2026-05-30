import { pgTable, pgEnum, uuid, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'
import { vehicles } from './vehicle'
import { units } from './unit'

// Enum
export const vehiclePassTypeEnum = pgEnum('vehicle_pass_type', ['resident', 'guest', 'temporary'])

// Vehicle Passes
export const vehiclePasses = pgTable('vehicle_passes', {
  id: uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id),
  unitId: uuid('unit_id').references(() => units.id),
  token: text('token').notNull().unique(),
  passType: vehiclePassTypeEnum('pass_type').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  issuedBy: text('issued_by').notNull().references(() => user.id),
  description: text('description'),
  occupantLimit: integer('occupant_limit'),
  expiresAt: timestamp('expires_at'),
  notes: text('notes'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deactivatedAt: timestamp('deactivated_at'),
}, (table) => [
  index('vehicle_pass_token_idx').on(table.token),
  index('vehicle_pass_vehicle_idx').on(table.vehicleId),
  index('vehicle_pass_tenant_idx').on(table.tenantId),
  index('vehicle_pass_tenant_vehicle_idx').on(table.tenantId, table.vehicleId),
])
