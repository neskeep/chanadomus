import { pgTable, pgEnum, uuid, text, timestamp, boolean, index, jsonb } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'

// Enums
export const supportTicketTypeEnum = pgEnum('support_ticket_type', ['bug', 'sugerencia', 'pregunta'])
export const supportTicketPriorityEnum = pgEnum('support_ticket_priority', ['baja', 'media', 'alta', 'critica'])
export const supportTicketStatusEnum = pgEnum('support_ticket_status', ['nuevo', 'en_revision', 'en_desarrollo', 'resuelto', 'cerrado'])

// Support Tickets
export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: supportTicketTypeEnum('type').notNull().default('bug'),
  priority: supportTicketPriorityEnum('priority').notNull().default('media'),
  status: supportTicketStatusEnum('status').notNull().default('nuevo'),
  pageUrl: text('page_url'),
  userAgent: text('user_agent'),
  resolvedInVersion: text('resolved_in_version'),
  isPublic: boolean('is_public').notNull().default(false),
  reportedById: text('reported_by_id').notNull().references(() => user.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at'),
}, (table) => [
  index('support_ticket_tenant_idx').on(table.tenantId),
  index('support_ticket_reported_by_idx').on(table.reportedById),
  index('support_ticket_status_idx').on(table.status),
  index('support_ticket_type_idx').on(table.type),
])

// Support Ticket Screenshots
export const supportTicketScreenshots = pgTable('support_ticket_screenshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => supportTickets.id, { onDelete: 'cascade' }),
  filePath: text('file_path').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('support_screenshot_ticket_idx').on(table.ticketId),
])

// Support Ticket Updates (status change log)
export const supportTicketUpdates = pgTable('support_ticket_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => supportTickets.id, { onDelete: 'cascade' }),
  oldStatus: supportTicketStatusEnum('old_status').notNull(),
  newStatus: supportTicketStatusEnum('new_status').notNull(),
  note: text('note'),
  updatedById: text('updated_by_id').notNull().references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('support_update_ticket_idx').on(table.ticketId),
])

// Changelog Entries
export const changelogEntries = pgTable('changelog_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  version: text('version').notNull(),
  title: text('title').notNull(),
  changes: jsonb('changes').notNull().$type<Array<{ type: string; description: string }>>(),
  publishedAt: timestamp('published_at').notNull(),
  createdById: text('created_by_id').notNull().references(() => user.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('changelog_tenant_idx').on(table.tenantId),
  index('changelog_version_idx').on(table.version),
])
