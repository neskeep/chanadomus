import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import { tenants } from './schema/tenant'
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

  // Predefined group rooms. 'general' e 'incidencias' se retiraron (ticket e8415ba2,
  // ver HIDDEN_CHAT_ROOM_TYPES): no se vuelven a crear; las existentes quedan ocultas.
  const groupRooms = [
    { name: 'Vigilancia', type: 'vigilancia' as const },
    { name: 'Conserjería', type: 'conserjeria' as const },
    { name: 'Propietarios', type: 'propietarios' as const },
    { name: 'Administracion', type: 'admin' as const },
  ]

  for (const room of groupRooms) {
    await db.insert(chatRooms).values({
      name: room.name,
      type: room.type,
      tenantId: tenant.id,
    }).onConflictDoNothing()
    console.log(`  Room: ${room.name}`)
  }

  console.log('Chat seed complete!')
  await client.end()
}

seedChat().catch((e) => {
  console.error('Chat seed failed:', e)
  process.exit(1)
})
