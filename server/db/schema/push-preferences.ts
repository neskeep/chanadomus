import { pgTable, uuid, text, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { tenants } from './tenant'

export const pushPreferences = pgTable('push_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  // Categories
  acceso: boolean('acceso').notNull().default(true),
  anuncio: boolean('anuncio').notNull().default(true),
  incidencia: boolean('incidencia').notNull().default(true),
  votacion: boolean('votacion').notNull().default(true),
  panico: boolean('panico').notNull().default(true),
  finanzas: boolean('finanzas').notNull().default(true),
  chat: boolean('chat').notNull().default(true),
  soporte: boolean('soporte').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('push_pref_user_tenant_idx').on(table.userId, table.tenantId),
])
