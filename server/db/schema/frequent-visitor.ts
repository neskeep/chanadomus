import { pgTable, uuid, text, timestamp, integer, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'
import { units } from './unit'
import { visitorTypeEnum } from './access'

// Frequent Visitors — directorio de visitantes recurrentes por propietario
export const frequentVisitors = pgTable('frequent_visitors', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: text('owner_id').notNull().references(() => user.id),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  visitorName: text('visitor_name').notNull(),
  visitorDocument: text('visitor_document'),
  visitorType: visitorTypeEnum('visitor_type').notNull().default('invitado'),
  vehiclePlate: text('vehicle_plate'),
  lastVisitAt: timestamp('last_visit_at'),
  visitCount: integer('visit_count').notNull().default(0),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('freq_visitor_owner_idx').on(table.ownerId),
  index('freq_visitor_tenant_idx').on(table.tenantId),
  index('freq_visitor_unit_idx').on(table.unitId),
])
