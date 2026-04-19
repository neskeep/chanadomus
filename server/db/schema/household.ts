import { pgTable, pgEnum, uuid, text, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { units } from './unit'

// Enums
export const householdRelationshipEnum = pgEnum('household_relationship', ['owner', 'spouse', 'child', 'tenant', 'other'])

// Household Members
export const householdMembers = pgTable('household_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  name: text('name').notNull(),
  relationship: householdRelationshipEnum('relationship').notNull(),
  idDocument: text('id_document'),
  phone: text('phone'),
  isActive: boolean('is_active').notNull().default(true),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('household_tenant_idx').on(table.tenantId),
  index('household_unit_idx').on(table.unitId),
])
