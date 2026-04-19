import { pgTable, pgEnum, uuid, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { units } from './unit'
import { user } from './auth'

export const chatRoomTypeEnum = pgEnum('chat_room_type', ['general', 'unit', 'vigilancia', 'admin'])

export const chatRooms = pgTable('chat_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: chatRoomTypeEnum('type').notNull(),
  unitId: uuid('unit_id').references(() => units.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('chat_room_tenant_idx').on(table.tenantId),
  uniqueIndex('chat_room_tenant_type_unit_idx').on(table.tenantId, table.type, table.unitId),
])

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().references(() => chatRooms.id),
  userId: text('user_id').notNull().references(() => user.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('message_room_created_idx').on(table.roomId, table.createdAt),
])
