import { db } from '~~/server/db'
import { changelogEntries } from '~~/server/db/schema/support'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de entrada requerido' })
  }

  // Check existence and tenant scope
  const [existing] = await db
    .select({ id: changelogEntries.id })
    .from(changelogEntries)
    .where(and(
      eq(changelogEntries.id, id),
      eq(changelogEntries.tenantId, session.tenantId),
    ))

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Entrada de changelog no encontrada' })
  }

  // Delete
  await db
    .delete(changelogEntries)
    .where(eq(changelogEntries.id, id))

  return { success: true }
})
