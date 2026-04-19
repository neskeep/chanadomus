import { pgTable, uuid, text, timestamp, integer, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'

export const financialReports = pgTable('financial_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  filePath: text('file_path').notNull(),
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(),
  uploadedById: text('uploaded_by_id').notNull().references(() => user.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('report_tenant_idx').on(table.tenantId),
  index('report_year_month_idx').on(table.year, table.month),
])
