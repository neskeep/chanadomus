import { pgTable, pgEnum, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'

export const regulationCategoryEnum = pgEnum('regulation_category', ['normas', 'horarios', 'arquitectura'])

export const regulations = pgTable('regulations', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  category: regulationCategoryEnum('category').notNull(),
  attachmentPath: text('attachment_path').notNull(),
  authorId: text('author_id').notNull().references(() => user.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  publishedAt: timestamp('published_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('regulation_tenant_idx').on(table.tenantId),
  index('regulation_category_idx').on(table.category),
  index('regulation_published_at_idx').on(table.publishedAt),
])
