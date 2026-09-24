import { sql } from 'drizzle-orm'
import { pgTable, uuid, text, timestamp, date, numeric, integer, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'
import { units } from './unit'
import type { MembershipCounts, MembershipTier, MembershipUnitKind } from '../../../shared/types/membership'

/**
 * Membresía: cobro mensual de ChanaDomus al condominio, por unidad.
 * Reglas en shared/lib/membership.ts; cálculo en server/utils/membership.ts.
 */

// Historial de tarifas. Cambiar una tarifa inserta una fila nueva; los cierres guardan su propia copia.
export const membershipRates = pgTable('membership_rates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  fullRate: numeric('full_rate', { precision: 10, scale: 2 }).notNull(),
  reducedRate: numeric('reduced_rate', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  effectiveFrom: date('effective_from', { mode: 'string' }).notNull(),
  notes: text('notes'),
  createdById: text('created_by_id').references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('membership_rate_tenant_idx').on(table.tenantId),
  index('membership_rate_tenant_from_idx').on(table.tenantId, table.effectiveFrom),
])

// Cierre mensual: foto del mes facturado. closed_by_id null = cierre automático.
export const membershipClosings = pgTable('membership_closings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  period: text('period').notNull(), // 'YYYY-MM'
  fullRate: numeric('full_rate', { precision: 10, scale: 2 }).notNull(),
  reducedRate: numeric('reduced_rate', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  unitsFull: integer('units_full').notNull().default(0),
  unitsReduced: integer('units_reduced').notNull().default(0),
  total: numeric('total', { precision: 12, scale: 2 }).notNull().default('0'),
  closedAt: timestamp('closed_at').notNull().defaultNow(),
  closedById: text('closed_by_id').references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('membership_closing_tenant_idx').on(table.tenantId),
  uniqueIndex('membership_closing_tenant_period_idx').on(table.tenantId, table.period),
])

// Instantánea por unidad de un cierre.
export const membershipClosingUnits = pgTable('membership_closing_units', {
  id: uuid('id').primaryKey().defaultRandom(),
  closingId: uuid('closing_id').notNull().references(() => membershipClosings.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  unitNumber: text('unit_number').notNull(),
  unitLabel: text('unit_label'),
  unitKind: text('unit_kind').$type<MembershipUnitKind>().notNull().default('otra'),
  isActive: boolean('is_active').notNull().default(true),
  tier: text('tier').$type<MembershipTier>().notNull(),
  rate: numeric('rate', { precision: 10, scale: 2 }).notNull(),
  reasons: jsonb('reasons').$type<MembershipCounts>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('membership_closing_unit_tenant_idx').on(table.tenantId),
  uniqueIndex('membership_closing_unit_closing_unit_idx').on(table.closingId, table.unitId),
])
