import { pgTable, pgEnum, uuid, text, timestamp, integer, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'

// Enums
export const providerCategoryEnum = pgEnum('provider_category', [
  'plomeria',
  'electricidad',
  'jardineria',
  'cerrajeria',
  'limpieza',
  'pintura',
  'albanileria',
  'seguridad',
  'fumigacion',
  'otro',
])

export const providerStatusEnum = pgEnum('provider_status', ['active', 'inactive', 'pending'])

// Providers
export const providers = pgTable('providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone'),
  photo: text('photo'),
  schedule: text('schedule'),
  address: text('address'),
  services: text('services').array(),
  costs: text('costs'),
  notes: text('notes'),
  category: providerCategoryEnum('category').notNull(),
  status: providerStatusEnum('status').notNull().default('active'),
  createdById: text('created_by_id').notNull().references(() => user.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('provider_tenant_idx').on(table.tenantId),
  index('provider_category_idx').on(table.category),
  index('provider_status_idx').on(table.status),
  index('provider_created_by_idx').on(table.createdById),
])

// Provider Reviews
export const providerReviews = pgTable('provider_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  reviewerId: text('reviewer_id').notNull().references(() => user.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('provider_review_provider_idx').on(table.providerId),
  index('provider_review_reviewer_idx').on(table.reviewerId),
  index('provider_review_tenant_idx').on(table.tenantId),
])
