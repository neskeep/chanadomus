import { pgTable, pgEnum, uuid, text, timestamp, integer, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { tenants } from './tenant'
import { user } from './auth'
import { units } from './unit'
import { accessLogs } from './access'

// Enums
export const eventStatusEnum = pgEnum('event_status', ['pendiente', 'activo', 'completado', 'cancelado'])
export const guestStatusEnum = pgEnum('guest_status', ['pendiente', 'dentro', 'salio'])

// Events
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  createdById: text('created_by_id').notNull().references(() => user.id),
  approvedById: text('approved_by_id').references(() => user.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  status: eventStatusEnum('status').notNull().default('pendiente'),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  guestLimit: integer('guest_limit'), // nullable = sin limite
  notes: text('notes'), // notas internas para vigilancia
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('event_tenant_idx').on(table.tenantId),
  index('event_unit_idx').on(table.unitId),
  index('event_status_idx').on(table.status),
  index('event_starts_at_idx').on(table.startsAt),
  index('event_created_by_idx').on(table.createdById),
])

// Event Guests
export const eventGuests = pgTable('event_guests', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  document: text('document'), // cedula, opcional
  vehiclePlate: text('vehicle_plate'), // placa, opcional
  status: guestStatusEnum('status').notNull().default('pendiente'),
  checkedInAt: timestamp('checked_in_at'),
  checkedOutAt: timestamp('checked_out_at'),
  checkedInBy: text('checked_in_by').references(() => user.id),
  checkedOutBy: text('checked_out_by').references(() => user.id),
  accessLogId: uuid('access_log_id').references(() => accessLogs.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('event_guest_event_idx').on(table.eventId),
  index('event_guest_tenant_idx').on(table.tenantId),
  index('event_guest_name_idx').on(table.name),
  index('event_guest_status_idx').on(table.eventId, table.status),
])

// Relations
export const eventsRelations = relations(events, ({ one, many }) => ({
  unit: one(units, { fields: [events.unitId], references: [units.id] }),
  createdBy: one(user, { fields: [events.createdById], references: [user.id], relationName: 'eventCreator' }),
  approvedBy: one(user, { fields: [events.approvedById], references: [user.id], relationName: 'eventApprover' }),
  guests: many(eventGuests),
}))

export const eventGuestsRelations = relations(eventGuests, ({ one }) => ({
  event: one(events, { fields: [eventGuests.eventId], references: [events.id] }),
  checkedInByUser: one(user, { fields: [eventGuests.checkedInBy], references: [user.id], relationName: 'guestCheckedInBy' }),
  checkedOutByUser: one(user, { fields: [eventGuests.checkedOutBy], references: [user.id], relationName: 'guestCheckedOutBy' }),
  accessLog: one(accessLogs, { fields: [eventGuests.accessLogId], references: [accessLogs.id] }),
}))
