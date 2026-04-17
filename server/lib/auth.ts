import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { db } from '~~/server/db'
import { ac, adminRole, propietarioRole, conserjeRole, vigilanciaRole } from '~~/shared/lib/permissions'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: 'pg',
  }),

  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      tenantId: {
        type: 'string',
        required: true,
        input: false,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh every 24h
  },

  plugins: [
    admin({
      defaultRole: 'propietario',
      adminRoles: ['admin'],
      ac,
      roles: {
        admin: adminRole,
        propietario: propietarioRole,
        conserje: conserjeRole,
        vigilancia: vigilanciaRole,
      },
    }),
  ],
})

export type Auth = typeof auth
