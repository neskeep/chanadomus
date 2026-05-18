import { pgTable, pgEnum, uuid, text, timestamp, integer, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { units } from './unit'
import { user } from './auth'

export const chatRoomTypeEnum = pgEnum('chat_room_type', ['general', 'unit', 'vigilancia', 'admin', 'conserjeria', 'incidencias', 'propietarios'])

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

export const chatAttachments = pgTable('chat_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  filePath: text('file_path').notNull(),
  width: integer('width'),
  height: integer('height'),
  fileSize: integer('file_size').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('chat_attachment_message_idx').on(table.messageId),
])

export const chatReadStatus = pgTable('chat_read_status', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().references(() => chatRooms.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  lastReadAt: timestamp('last_read_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('chat_read_status_room_user_idx').on(table.roomId, table.userId),
  index('chat_read_status_user_idx').on(table.userId),
])
