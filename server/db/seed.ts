import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { hashPassword } from 'better-auth/crypto'
import { tenants } from './schema/tenant'
import { user, account } from './schema/auth'
import { units } from './schema/unit'
import { accessLogs } from './schema/access'

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
  let vigilanteUserId = ''

  for (const u of SEED_USERS) {
    const userId = crypto.randomUUID()

    if (u.role === 'vigilancia') {
      vigilanteUserId = userId
    }

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

  // 3. Create 74 units (ranchos) — R-075 to R-086 don't exist
  const unitValues = Array.from({ length: 74 }, (_, i) => ({
    number: `R-${String(i + 1).padStart(3, '0')}`,
    label: `Rancho ${i + 1}`,
    tenantId: tenant.id,
  }))

  const insertedUnits = await db.insert(units).values(unitValues).returning()
  console.log(`  Units: ${insertedUnits.length} ranchos created`)

  // 4. Assign Rancho 1 (R-001) to propietario
  const rancho1 = insertedUnits.find(u => u.number === 'R-001')
  if (rancho1) {
    await db.update(user)
      .set({ unitId: rancho1.id })
      .where(eq(user.email, 'propietario@chanadomus.com'))
    console.log(`  Assigned ${rancho1.label} to propietario@chanadomus.com`)
  }

  // 5. Create access logs (dummy data for vigilancia view)
  const accessSeedData = [
    { visitorName: 'Carlos Mendoza', visitorDocument: 'V-18.456.789', entryType: 'manual' as const, result: 'allowed' as const, unitIdx: 0, minutesAgo: 180, exitMinutesAgo: 90 as number | null },
    { visitorName: 'María González', visitorDocument: 'V-20.123.456', entryType: 'qr' as const, result: 'allowed' as const, unitIdx: 4, minutesAgo: 150, exitMinutesAgo: 60 as number | null },
    { visitorName: 'José Rodríguez', visitorDocument: 'V-15.789.012', entryType: 'manual' as const, result: 'allowed' as const, unitIdx: 2, minutesAgo: 120, exitMinutesAgo: 30 as number | null },
    { visitorName: 'Ana Martínez', visitorDocument: 'V-22.345.678', entryType: 'qr' as const, result: 'allowed' as const, unitIdx: 7, minutesAgo: 45, exitMinutesAgo: null },
    { visitorName: 'Pedro Hernández', visitorDocument: null, entryType: 'manual' as const, result: 'allowed' as const, unitIdx: 1, minutesAgo: 30, exitMinutesAgo: null },
    { visitorName: 'Luis Ramírez', visitorDocument: 'V-19.876.543', entryType: 'manual' as const, result: 'allowed' as const, unitIdx: 10, minutesAgo: 15, exitMinutesAgo: null },
    { visitorName: 'Carmen Flores', visitorDocument: 'V-24.567.890', entryType: 'qr' as const, result: 'allowed' as const, unitIdx: 3, minutesAgo: 5, exitMinutesAgo: null },
    { visitorName: 'Roberto Díaz', visitorDocument: 'V-16.234.567', entryType: 'manual' as const, result: 'denied' as const, unitIdx: 5, minutesAgo: 100, exitMinutesAgo: null },
    { visitorName: 'Sofía Pérez', visitorDocument: 'V-21.098.765', entryType: 'qr' as const, result: 'expired' as const, unitIdx: 8, minutesAgo: 80, exitMinutesAgo: null },
    { visitorName: 'Diego Morales', visitorDocument: null, entryType: 'qr' as const, result: 'already_used' as const, unitIdx: 12, minutesAgo: 65, exitMinutesAgo: null },
    { visitorName: 'Valentina Torres', visitorDocument: 'V-25.111.222', entryType: 'webhook' as const, result: 'allowed' as const, unitIdx: 15, minutesAgo: 10, exitMinutesAgo: null },
    { visitorName: 'Andrés Silva', visitorDocument: 'V-17.333.444', entryType: 'manual' as const, result: 'allowed' as const, unitIdx: 6, minutesAgo: 2, exitMinutesAgo: null },
  ]

  // Sort by minutesAgo descending so oldest entries are inserted first
  const sortedAccessData = accessSeedData.sort((a, b) => b.minutesAgo - a.minutesAgo)

  const accessLogValues = sortedAccessData.map(entry => ({
    entryType: entry.entryType,
    result: entry.result,
    visitorName: entry.visitorName,
    visitorDocument: entry.visitorDocument,
    unitId: insertedUnits[entry.unitIdx]!.id,
    tenantId: tenant.id,
    authorizedBy: vigilanteUserId,
    createdAt: new Date(Date.now() - entry.minutesAgo * 60000),
    exitAt: entry.exitMinutesAgo !== null ? new Date(Date.now() - entry.exitMinutesAgo * 60000) : null,
  }))

  await db.insert(accessLogs).values(accessLogValues)
  console.log(`  Access logs: ${accessLogValues.length} entries created`)

  console.log('Seed complete!')

  await client.end()
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
