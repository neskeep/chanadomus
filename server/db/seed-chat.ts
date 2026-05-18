import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import { tenants } from './schema/tenant'
import { units } from './schema/unit'
import { chatRooms } from './schema/chat'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
const db = drizzle(client)

async function seedChat() {
  console.log('Seeding chat rooms...')

  // Get tenant
  const tenantRows = await db.select().from(tenants).where(eq(tenants.slug, 'ranchos-de-chana'))
  const tenant = tenantRows[0]
  if (!tenant) {
    console.error('Tenant not found. Run main seed first.')
    process.exit(1)
  }

  // Get all units
  const unitRows = await db.select().from(units).where(eq(units.tenantId, tenant.id))

  // Create general room
  await db.insert(chatRooms).values({
    name: 'General',
    type: 'general',
    tenantId: tenant.id,
  }).onConflictDoNothing()
  console.log('  Room: General')

  // Create vigilancia room
  await db.insert(chatRooms).values({
    name: 'Vigilancia',
    type: 'vigilancia',
    tenantId: tenant.id,
  }).onConflictDoNothing()
  console.log('  Room: Vigilancia')

  // Create conserjeria room
  await db.insert(chatRooms).values({
    name: 'Conserjería',
    type: 'conserjeria',
    tenantId: tenant.id,
  }).onConflictDoNothing()
  console.log('  Room: Conserjería')

  // Create incidencias room
  await db.insert(chatRooms).values({
    name: 'Incidencias',
    type: 'incidencias',
    tenantId: tenant.id,
  }).onConflictDoNothing()
  console.log('  Room: Incidencias')

  // Create propietarios room
  await db.insert(chatRooms).values({
    name: 'Propietarios',
    type: 'propietarios',
    tenantId: tenant.id,
  }).onConflictDoNothing()
  console.log('  Room: Propietarios')

  // Create admin room
  await db.insert(chatRooms).values({
    name: 'Administracion',
    type: 'admin',
    tenantId: tenant.id,
  }).onConflictDoNothing()
  console.log('  Room: Administracion')

  // Create one room per unit
  const unitRoomValues = unitRows.map((unit) => ({
    name: unit.label || unit.number,
    type: 'unit' as const,
    unitId: unit.id,
    tenantId: tenant.id,
  }))

  if (unitRoomValues.length > 0) {
    await db.insert(chatRooms).values(unitRoomValues).onConflictDoNothing()
    console.log(`  Rooms: ${unitRoomValues.length} unit rooms created`)
  }

  console.log('Chat seed complete!')
  await client.end()
}

seedChat().catch((e) => {
  console.error('Chat seed failed:', e)
  process.exit(1)
})
