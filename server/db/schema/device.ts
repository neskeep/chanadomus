import { pgTable, pgEnum, uuid, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'

// Enums
export const deviceStatusEnum = pgEnum('device_status', ['active', 'inactive'])

// Devices — hardware de control de acceso
export const devices = pgTable('devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(), // ej: "Alcabala Principal"
  deviceKeyHash: text('device_key_hash').notNull(), // SHA-256 hash del API key
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  location: text('location'), // ej: "Entrada principal"
  status: deviceStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('device_tenant_idx').on(table.tenantId),
  uniqueIndex('device_key_hash_idx').on(table.deviceKeyHash),
])
