import { pgTable, pgEnum, uuid, text, timestamp, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenant'
import { user } from './auth'

// Enums
export const meetingTypeEnum = pgEnum('meeting_type', [
  'ordinaria',
  'extraordinaria',
  'comite',
  'informativa',
])

export const meetingStatusEnum = pgEnum('meeting_status', [
  'programada',
  'en_curso',
  'completada',
  'cancelada',
])

// Meetings
export const meetings = pgTable('meetings', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  date: timestamp('date').notNull(),
  endDate: timestamp('end_date'),
  location: text('location'),
  meetingLink: text('meeting_link'),
  type: meetingTypeEnum('type').notNull(),
  status: meetingStatusEnum('status').notNull().default('programada'),
  agenda: text('agenda'),
  minutes: text('minutes'),
  minutesAttendees: text('minutes_attendees'),
  minutesQuorum: boolean('minutes_quorum'),
  minutesPoints: text('minutes_points'),
  minutesAgreements: text('minutes_agreements'),
  minutesNotes: text('minutes_notes'),
  agendaItems: jsonb('agenda_items').$type<{ text: string; discussed?: string }[]>(),
  minutesAttendeesData: jsonb('minutes_attendees_data').$type<{ id: string; name: string }[]>(),
  minutesAgreementsList: jsonb('minutes_agreements_list').$type<string[]>(),
  createdById: text('created_by_id').notNull().references(() => user.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  displayOrder: integer('display_order').notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('meeting_tenant_idx').on(table.tenantId),
  index('meeting_type_idx').on(table.type),
  index('meeting_status_idx').on(table.status),
  index('meeting_date_idx').on(table.date),
  index('meeting_created_by_idx').on(table.createdById),
])
