import { pgTable, pgEnum, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'

// Enums
export const announcementCategoryEnum = pgEnum('announcement_category', ['general', 'mantenimiento', 'seguridad', 'financiero', 'evento', 'urgente'])
export const announcementStatusEnum = pgEnum('announcement_status', ['draft', 'published', 'archived'])

// Announcements
export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  category: announcementCategoryEnum('category').notNull().default('general'),
  status: announcementStatusEnum('status').notNull().default('draft'),
  attachmentPath: text('attachment_path'),
  authorId: text('author_id').notNull().references(() => user.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  publishedAt: timestamp('published_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('announcement_tenant_idx').on(table.tenantId),
  index('announcement_status_idx').on(table.status),
  index('announcement_author_idx').on(table.authorId),
  index('announcement_published_at_idx').on(table.publishedAt),
])
