import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { eq, and } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { user } from './schema/auth'
import { staff } from './schema/staff'
import { units } from './schema/unit'
import { tenants } from './schema/tenant'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
const db = drizzle(client)

async function run() {
  console.log('Asignando rancho al conserje demo...')

  // 1. Obtener tenant
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, 'ranchos-de-chana')).limit(1)
  if (!tenant) throw new Error('Tenant no encontrado')

  // 2. Obtener propietario demo para saber su unitId
  const [propietario] = await db.select({ unitId: user.unitId }).from(user).where(eq(user.email, 'propietario@chanadomus.com')).limit(1)
  if (!propietario?.unitId) throw new Error('Propietario demo no tiene unitId asignado')
  console.log(`  Propietario unitId: ${propietario.unitId}`)

  // 3. Obtener conserje demo user
  const [conserje] = await db.select({ id: user.id, name: user.name }).from(user).where(eq(user.email, 'conserje@chanadomus.com')).limit(1)
  if (!conserje) throw new Error('Conserje demo no encontrado')
  console.log(`  Conserje userId: ${conserje.id}`)

  // 4. Verificar si ya existe registro en staff para este conserje
  const [existingStaff] = await db
    .select({ id: staff.id, unitId: staff.unitId })
    .from(staff)
    .where(and(eq(staff.userId, conserje.id), eq(staff.tenantId, tenant.id)))
    .limit(1)

  if (existingStaff) {
    // Actualizar unitId
    await db.update(staff).set({ unitId: propietario.unitId }).where(eq(staff.id, existingStaff.id))
    console.log(`  Staff existente actualizado con unitId: ${propietario.unitId}`)
  } else {
    // Crear registro staff
    await db.insert(staff).values({
      name: conserje.name,
      role: 'conserje',
      userId: conserje.id,
      unitId: propietario.unitId,
      qrToken: randomUUID(),
      tenantId: tenant.id,
      isActive: true,
    })
    console.log(`  Staff creado con unitId: ${propietario.unitId}`)
  }

  // 5. Verificar resultado
  const [verify] = await db
    .select({ staffId: staff.id, unitId: staff.unitId, unitNumber: units.number })
    .from(staff)
    .innerJoin(units, eq(units.id, staff.unitId))
    .where(and(eq(staff.userId, conserje.id), eq(staff.tenantId, tenant.id)))
    .limit(1)

  console.log(`  Verificado: staff ${verify?.staffId} -> ${verify?.unitNumber} (${verify?.unitId})`)
  console.log('Listo!')

  await client.end()
}

run().catch((e) => {
  console.error('Error:', e)
  process.exit(1)
})
