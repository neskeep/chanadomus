import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { hashPassword } from 'better-auth/crypto'
import { tenants } from './schema/tenant'
import { user, account } from './schema/auth'
import { units } from './schema/unit'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
const db = drizzle(client)

async function seed() {
  console.log('Seeding database...')

  // 1. Create tenant
  const rows = await db.insert(tenants).values({
    name: 'Ranchos de Chana',
    slug: 'ranchos-de-chana',
    status: 'active',
  }).returning()
  const tenant = rows[0]!
  console.log(`  Tenant: ${tenant.name} (${tenant.id})`)

  // 2. Create admin user directly
  const userId = crypto.randomUUID()
  const now = new Date()
  const hashedPassword = await hashPassword('Admin2026!')

  await db.insert(user).values({
    id: userId,
    name: 'Administrador',
    email: 'admin@chanadomus.com',
    emailVerified: true,
    role: 'admin',
    tenantId: tenant.id,
    createdAt: now,
    updatedAt: now,
  })

  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: 'credential',
    userId: userId,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  })

  console.log(`  Admin: admin@chanadomus.com / Admin2026!`)

  // 3. Create 86 units (ranchos)
  const unitValues = Array.from({ length: 86 }, (_, i) => ({
    number: `R-${String(i + 1).padStart(3, '0')}`,
    label: `Rancho ${i + 1}`,
    tenantId: tenant.id,
  }))

  await db.insert(units).values(unitValues)
  console.log(`  Units: ${unitValues.length} ranchos created`)

  console.log('Seed complete!')

  await client.end()
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
