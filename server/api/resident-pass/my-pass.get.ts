import { db } from '~~/server/db'
import { residentPasses } from '~~/server/db/schema/resident-pass'
import { user } from '~~/server/db/schema/auth'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenant(event)
  const session = await requireAuth(event)

  const role = session.user.role ?? ''
  if (!['propietario', 'admin'].includes(role)) {
    throw createError({ statusCode: 403, message: 'Sin permisos' })
  }

  const userId = session.user.id

  // Get user's unitId
  const [userData] = await db
    .select({ unitId: user.unitId })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  if (!userData?.unitId) {
    throw createError({ statusCode: 400, message: 'Usuario sin unidad asignada' })
  }

  const unitId = userData.unitId
  const now = new Date()

  // Look for active pass
  const [existingPass] = await db
    .select()
    .from(residentPasses)
    .where(
      and(
        eq(residentPasses.userId, userId),
        eq(residentPasses.tenantId, tenantId),
        eq(residentPasses.isActive, true),
      ),
    )
    .limit(1)

  // If active pass exists and not expired, return it
  if (existingPass && existingPass.expiresAt > now) {
    return {
      data: {
        id: existingPass.id,
        token: existingPass.token,
        expiresAt: existingPass.expiresAt.toISOString(),
        createdAt: existingPass.createdAt.toISOString(),
        unitId: existingPass.unitId,
      },
    }
  }

  // If expired, deactivate it
  if (existingPass && existingPass.expiresAt <= now) {
    await db
      .update(residentPasses)
      .set({ isActive: false, updatedAt: now })
      .where(eq(residentPasses.id, existingPass.id))
  }

  // Create new pass (1 year expiry)
  const expiresAt = new Date(now)
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  const [newPass] = await db
    .insert(residentPasses)
    .values({
      userId,
      unitId,
      token: randomUUID(),
      isActive: true,
      expiresAt,
      tenantId,
    })
    .returning()

  if (!newPass) {
    throw createError({ statusCode: 500, message: 'Error al crear pase de residente' })
  }

  return {
    data: {
      id: newPass.id,
      token: newPass.token,
      expiresAt: newPass.expiresAt.toISOString(),
      createdAt: newPass.createdAt.toISOString(),
      unitId: newPass.unitId,
    },
  }
})
