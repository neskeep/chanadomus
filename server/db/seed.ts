import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { hashPassword } from 'better-auth/crypto'
import { tenants } from './schema/tenant'
import { user, account } from './schema/auth'
import { units } from './schema/unit'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
const db = drizzle(client)

interface SeedUser {
  name: string
  email: string
  password: string
  role: string
  tenantId: string
}

async function createUser(data: SeedUser) {
  const id = crypto.randomUUID()
  const now = new Date()
  const hashedPw = await hashPassword(data.password)

  await db.insert(user).values({
    id,
    name: data.name,
    email: data.email,
    emailVerified: true,
    role: data.role,
    tenantId: data.tenantId,
    createdAt: now,
    updatedAt: now,
  })

  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: id,
    providerId: 'credential',
    userId: id,
    password: hashedPw,
    createdAt: now,
    updatedAt: now,
  })

  console.log(`  ${data.role}: ${data.email} / ${data.password}`)
}

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

  // 2. Create demo users (one per role)
  await createUser({
    name: 'Administrador',
    email: 'admin@chanadomus.com',
    password: 'Admin2026!',
    role: 'admin',
    tenantId: tenant.id,
  })

  const demoUsers: Omit<SeedUser, 'tenantId'>[] = [
    { name: 'Propietario Demo', email: 'propietario@chanadomus.com', password: 'Demo2026!', role: 'propietario' },
    { name: 'Conserje Demo', email: 'conserje@chanadomus.com', password: 'Demo2026!', role: 'conserje' },
    { name: 'Vigilancia Demo', email: 'vigilancia@chanadomus.com', password: 'Demo2026!', role: 'vigilancia' },
  ]

  for (const demoUser of demoUsers) {
    await createUser({ ...demoUser, tenantId: tenant.id })
  }

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
