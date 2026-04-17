import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  config: jsonb('config').default({}).$type<{
    logo_url?: string
    primary_color?: string
    secondary_color?: string
  }>(),
  status: text('status', { enum: ['active', 'suspended'] }).notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
