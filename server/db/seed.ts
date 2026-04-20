import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { hashPassword } from 'better-auth/crypto'
import { tenants } from './schema/tenant'
import { user, account } from './schema/auth'
import { units } from './schema/unit'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
const db = drizzle(client)

const SEED_USERS = [
  { name: 'Administrador', email: 'admin@chanadomus.com', role: 'admin' as const },
  { name: 'Propietario Demo', email: 'propietario@chanadomus.com', role: 'propietario' as const },
  { name: 'Vigilante Demo', email: 'vigilante@chanadomus.com', role: 'vigilancia' as const },
  { name: 'Conserje Demo', email: 'conserje@chanadomus.com', role: 'conserje' as const },
]

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

  // 2. Create users (all roles)
  const hashedPassword = await hashPassword('Yolo2026!')
  const now = new Date()

  for (const u of SEED_USERS) {
    const userId = crypto.randomUUID()

    await db.insert(user).values({
      id: userId,
      name: u.name,
      email: u.email,
      emailVerified: true,
      role: u.role,
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

    console.log(`  ${u.role}: ${u.email} / Yolo2026!`)
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
