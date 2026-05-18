import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as tenantSchema from './schema/tenant'
import * as authSchema from './schema/auth'
import * as unitSchema from './schema/unit'
import * as accessSchema from './schema/access'
import * as deviceSchema from './schema/device'
import * as pushSchema from './schema/push'
import * as panicSchema from './schema/panic'
import * as financialSchema from './schema/financial'
import * as financialReportSchema from './schema/financial-report'
import * as incidentSchema from './schema/incident'
import * as householdSchema from './schema/household'
import * as vehicleSchema from './schema/vehicle'
import * as staffSchema from './schema/staff'
import * as chatSchema from './schema/chat'
import * as announcementSchema from './schema/announcement'
import * as pollSchema from './schema/poll'
import * as pushPreferencesSchema from './schema/push-preferences'
import * as providerSchema from './schema/provider'
import * as meetingSchema from './schema/meeting'
import * as frequentVisitorSchema from './schema/frequent-visitor'
import * as residentPassSchema from './schema/resident-pass'
import * as vehiclePassSchema from './schema/vehicle-pass'
import * as serviceStaffRoleSchema from './schema/service-staff-role'
import * as unitServiceStaffSchema from './schema/unit-service-staff'
import * as serviceStaffPassSchema from './schema/service-staff-pass'
import * as householdMemberPassSchema from './schema/household-member-pass'
import * as regulationSchema from './schema/regulation'

const connectionString = process.env.DATABASE_URL!

const client = postgres(connectionString)

export const db = drizzle(client, {
  schema: {
    ...tenantSchema,
    ...authSchema,
    ...unitSchema,
    ...accessSchema,
    ...deviceSchema,
    ...pushSchema,
    ...panicSchema,
    ...financialSchema,
    ...financialReportSchema,
    ...incidentSchema,
    ...householdSchema,
    ...vehicleSchema,
    ...staffSchema,
    ...chatSchema,
    ...announcementSchema,
    ...pollSchema,
    ...pushPreferencesSchema,
    ...providerSchema,
    ...meetingSchema,
    ...frequentVisitorSchema,
    ...residentPassSchema,
    ...vehiclePassSchema,
    ...serviceStaffRoleSchema,
    ...unitServiceStaffSchema,
    ...serviceStaffPassSchema,
    ...householdMemberPassSchema,
    ...regulationSchema,
  },
})
