import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'

// Push Subscriptions (Web Push VAPID)
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(), // client public key
  auth: text('auth').notNull(), // client auth secret
  role: text('role').notNull(), // rol al momento de suscripcion
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('push_sub_user_idx').on(table.userId),
  index('push_sub_tenant_idx').on(table.tenantId),
  index('push_sub_role_idx').on(table.role),
  index('push_sub_endpoint_idx').on(table.endpoint),
])
