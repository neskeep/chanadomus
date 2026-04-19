import { pgTable, pgEnum, uuid, text, timestamp, integer, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'
import { units } from './unit'

// Enums
export const pollStatusEnum = pgEnum('poll_status', ['draft', 'active', 'closed'])
export const pollTypeEnum = pgEnum('poll_type', ['single', 'multiple'])

// Polls (votaciones)
export const polls = pgTable('polls', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  type: pollTypeEnum('type').notNull().default('single'),
  status: pollStatusEnum('status').notNull().default('draft'),
  createdById: text('created_by_id').notNull().references(() => user.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  deadline: timestamp('deadline'),
  publishedAt: timestamp('published_at'),
  closedAt: timestamp('closed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('poll_tenant_idx').on(table.tenantId),
  index('poll_status_idx').on(table.status),
  index('poll_created_by_idx').on(table.createdById),
])

// Poll Options (opciones de votacion)
export const pollOptions = pgTable('poll_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  pollId: uuid('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('poll_option_poll_idx').on(table.pollId),
  index('poll_option_tenant_idx').on(table.tenantId),
])

// Poll Votes (votos — 1 por unidad por votacion)
export const pollVotes = pgTable('poll_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  pollId: uuid('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
  optionId: uuid('option_id').notNull().references(() => pollOptions.id, { onDelete: 'cascade' }),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  votedById: text('voted_by_id').notNull().references(() => user.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('poll_vote_poll_idx').on(table.pollId),
  index('poll_vote_tenant_idx').on(table.tenantId),
  uniqueIndex('poll_vote_unit_poll_idx').on(table.pollId, table.unitId),
])
