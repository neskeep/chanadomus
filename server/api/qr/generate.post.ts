import { db } from '~~/server/db'
import { qrCodes } from '~~/server/db/schema/access'
import { frequentVisitors } from '~~/server/db/schema/frequent-visitor'
import { units } from '~~/server/db/schema/unit'
import { eq, and, sql } from 'drizzle-orm'
import { qrExpiresAtError, qrGenerateSchema } from '~~/shared/lib/qr-pass'

export default defineEventHandler(async (event) => {
  const { tenantId, user } = await requireTenant(event)
  const session = await requireRole(event, ['propietario', 'admin', 'conserje'])

  // Mismas reglas que PATCH /api/qr/[id] (shared/lib/qr-pass.ts)
  const body = parseOrThrow(qrGenerateSchema, await readBody(event))

  const expiresAtDate = new Date(body.expiresAt)
  const expiresAtError = qrExpiresAtError(expiresAtDate)
  if (expiresAtError) {
    throw createError({ statusCode: 400, message: expiresAtError })
  }

  // Verificar que la unidad existe y pertenece al tenant
  const [unit] = await db
    .select({ id: units.id })
    .from(units)
    .where(and(eq(units.id, body.unitId), eq(units.tenantId, tenantId)))
    .limit(1)

  if (!unit) {
    throw createError({ statusCode: 404, message: 'Unidad no encontrada' })
  }

  // Conserje solo puede generar QR para su unidad asignada
  if (session.user.role === 'conserje') {
    const staffUnitId = await getStaffUnitId(user.id, tenantId)
    if (staffUnitId !== body.unitId) {
      throw createError({ statusCode: 403, message: 'Solo puedes generar QR para tu unidad asignada' })
    }
  }

  // Generar token y crear registro
  const token = crypto.randomUUID()

  const rows = await db
    .insert(qrCodes)
    .values({
      token,
      ownerId: user.id,
      visitorName: body.visitorName,
      visitorDocument: body.visitorDocument,
      visitorType: body.visitorType,
      unitId: body.unitId,
      tenantId,
      expiresAt: expiresAtDate,
      multiUse: body.multiUse === true,
    })
    .returning({
      id: qrCodes.id,
      token: qrCodes.token,
      visitorName: qrCodes.visitorName,
      visitorType: qrCodes.visitorType,
      expiresAt: qrCodes.expiresAt,
      createdAt: qrCodes.createdAt,
    })

  const created = rows[0]
  if (!created) {
    throw createError({ statusCode: 500, message: 'Error al crear codigo QR' })
  }

  // Si viene frequentVisitorId, actualizar lastVisitAt y visitCount
  if (body.frequentVisitorId) {
    await db
      .update(frequentVisitors)
      .set({
        lastVisitAt: new Date(),
        visitCount: sql`${frequentVisitors.visitCount} + 1`,
      })
      .where(
        and(
          eq(frequentVisitors.id, body.frequentVisitorId),
          eq(frequentVisitors.unitId, body.unitId),
          eq(frequentVisitors.tenantId, tenantId),
        ),
      )
  }

  return {
    data: {
      ...created,
      expiresAt: created.expiresAt.toISOString(),
      createdAt: created.createdAt.toISOString(),
    },
  }
})
