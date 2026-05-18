import { pgTable, pgEnum, uuid, text, timestamp, index, boolean } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'
import { units } from './unit'

// Enums
export const incidentStatusEnum = pgEnum('incident_status', ['open', 'in_progress', 'resolved', 'closed'])
export const incidentPriorityEnum = pgEnum('incident_priority', ['low', 'medium', 'high'])

// Incidents
export const incidents = pgTable('incidents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  priority: incidentPriorityEnum('priority').notNull().default('medium'),
  status: incidentStatusEnum('status').notNull().default('open'),
  reportedById: text('reported_by_id').notNull().references(() => user.id),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  resolvedAt: timestamp('resolved_at'),
}, (table) => [
  index('incident_tenant_idx').on(table.tenantId),
  index('incident_reported_by_idx').on(table.reportedById),
  index('incident_status_idx').on(table.status),
  index('incident_unit_idx').on(table.unitId),
])

// Incident Photos
export const incidentPhotos = pgTable('incident_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  incidentId: uuid('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
  filePath: text('file_path').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('incident_photo_incident_idx').on(table.incidentId),
])

// Incident Updates (status change log)
export const incidentUpdates = pgTable('incident_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  incidentId: uuid('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
  oldStatus: incidentStatusEnum('old_status').notNull(),
  newStatus: incidentStatusEnum('new_status').notNull(),
  note: text('note'),
  updatedById: text('updated_by_id').notNull().references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('incident_update_incident_idx').on(table.incidentId),
])
