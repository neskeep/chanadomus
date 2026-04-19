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
  },
})
