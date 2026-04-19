import { pgTable, pgEnum, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'
import { units } from './unit'
import { devices } from './device'

// Enums
export const visitorTypeEnum = pgEnum('visitor_type', ['invitado', 'proveedor'])
export const entryTypeEnum = pgEnum('entry_type', ['qr', 'manual', 'webhook'])
export const accessResultEnum = pgEnum('access_result', ['allowed', 'denied', 'expired', 'already_used'])

// QR Codes
export const qrCodes = pgTable('qr_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: text('token').notNull().unique(), // UUID v4 como string
  ownerId: text('owner_id').notNull().references(() => user.id),
  visitorName: text('visitor_name').notNull(),
  visitorDocument: text('visitor_document'), // cedula, opcional
  visitorType: visitorTypeEnum('visitor_type').notNull().default('invitado'),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'), // null = no usado
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('qr_token_idx').on(table.token),
  index('qr_owner_idx').on(table.ownerId),
  index('qr_tenant_idx').on(table.tenantId),
  index('qr_tenant_unit_idx').on(table.tenantId, table.unitId),
])

// Access Logs
export const accessLogs = pgTable('access_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  qrCodeId: uuid('qr_code_id').references(() => qrCodes.id), // nullable — logs manuales no tienen QR
  entryType: entryTypeEnum('entry_type').notNull(),
  authorizedBy: text('authorized_by').references(() => user.id), // nullable para QR automatico
  result: accessResultEnum('result').notNull(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  notes: text('notes'), // notas opcionales
  visitorName: text('visitor_name'), // para entries manuales/webhook sin QR
  visitorDocument: text('visitor_document'), // cedula para entries manuales
  unitId: uuid('unit_id').references(() => units.id), // unidad destino para entries manuales
  deviceId: uuid('device_id').references(() => devices.id), // dispositivo que origino el webhook
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('access_log_tenant_idx').on(table.tenantId),
  index('access_log_qr_idx').on(table.qrCodeId),
  index('access_log_created_idx').on(table.createdAt),
  index('access_log_device_idx').on(table.deviceId),
])
