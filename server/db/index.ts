import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as tenantSchema from './schema/tenant'
import * as authSchema from './schema/auth'

const connectionString = process.env.DATABASE_URL!

const client = postgres(connectionString)

export const db = drizzle(client, {
  schema: {
    ...tenantSchema,
    ...authSchema,
  },
})
