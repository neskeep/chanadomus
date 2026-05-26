/**
 * Backfill: genera resident_passes para todos los usuarios que no tengan uno activo.
 *
 * Uso: npx tsx --env-file=.env server/db/backfill-passes.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, and, notInArray } from 'drizzle-orm'
import { user } from './schema/auth'
import { residentPasses } from './schema/resident-pass'
import { staff } from './schema/staff'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
const db = drizzle(client)

async function backfillPasses() {
  // Usuarios que YA tienen un pass activo
  const usersWithPass = await db
    .selectDistinct({ userId: residentPasses.userId })
    .from(residentPasses)
    .where(eq(residentPasses.isActive, true))

  const existingUserIds = usersWithPass.map(r => r.userId)

  // Todos los usuarios activos (no baneados)
  const allUsers = existingUserIds.length > 0
    ? await db
        .select({ id: user.id, role: user.role, unitId: user.unitId, tenantId: user.tenantId, name: user.name })
        .from(user)
        .where(and(
          eq(user.banned, false),
          notInArray(user.id, existingUserIds),
        ))
    : await db
        .select({ id: user.id, role: user.role, unitId: user.unitId, tenantId: user.tenantId, name: user.name })
        .from(user)
        .where(eq(user.banned, false))

  if (allUsers.length === 0) {
    console.log('Todos los usuarios ya tienen un pase activo.')
    await client.end()
    return
  }

  console.log(`${allUsers.length} usuario(s) sin pase activo:`)

  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  let created = 0

  for (const u of allUsers) {
    // Resolver unitId: conserjes desde staff, el resto desde user
    let unitId: string | null = u.unitId

    if (u.role === 'conserje' && !unitId) {
      const [staffRecord] = await db
        .select({ unitId: staff.unitId })
        .from(staff)
        .where(and(eq(staff.userId, u.id), eq(staff.tenantId, u.tenantId!)))
        .limit(1)
      unitId = staffRecord?.unitId ?? null
    }

    await db.insert(residentPasses).values({
      userId: u.id,
      unitId,
      token: crypto.randomUUID(),
      isActive: true,
      expiresAt,
      tenantId: u.tenantId!,
    })

    console.log(`  + ${u.name} (${u.role}) — unitId: ${unitId ?? 'sin unidad'}`)
    created++
  }

  console.log(`\nListo: ${created} pase(s) creado(s), vigentes hasta ${expiresAt.toISOString().slice(0, 10)}`)
  await client.end()
}

backfillPasses().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
