import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { findDuplicateScan, withScanLock } from '~~/server/utils/access-entry-exit'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { units } from '~~/server/db/schema/unit'
import { accessLogs } from '~~/server/db/schema/access'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const passId = getRouterParam(event, 'id')

  if (!passId) {
    throw createError({ statusCode: 400, message: 'ID de pase requerido' })
  }

  const body = await readBody<{ unitId: string; occupantCount?: number; passToken?: string }>(event)

  if (!body.unitId?.trim()) {
    throw createError({ statusCode: 400, message: 'unitId es requerido' })
  }

  // Verify unit exists
  const [unit] = await db
    .select({ id: units.id, number: units.number, label: units.label })
    .from(units)
    .where(and(eq(units.id, body.unitId), eq(units.tenantId, session.tenantId)))
    .limit(1)

  if (!unit) {
    throw createError({ statusCode: 404, message: 'Unidad no encontrada' })
  }

  // Verify pass exists and belongs to tenant
  const [pass] = await db
    .select({ id: vehiclePasses.id, description: vehiclePasses.description, token: vehiclePasses.token })
    .from(vehiclePasses)
    .where(and(
      eq(vehiclePasses.id, passId),
      eq(vehiclePasses.tenantId, session.tenantId),
    ))
    .limit(1)

  if (!pass) {
    throw createError({ statusCode: 404, message: 'Pase no encontrado' })
  }

  // Mismo lock y ventana anti doble escaneo que /api/qr/validate: la entrada se
  // registra con el token del pase para que el escaneo de salida la encuentre.
  return withScanLock(session.tenantId, pass.token, async (ctx) => {
    const duplicate = await findDuplicateScan(ctx, session.tenantId, pass.token)
    if (duplicate) {
      return {
        data: {
          assigned: false,
          duplicate: true,
          message: duplicate.message,
          unitNumber: duplicate.unitNumber,
          unitLabel: duplicate.unitLabel,
        },
      }
    }

    await ctx.tx.update(vehiclePasses)
      .set({ unitId: body.unitId })
      .where(eq(vehiclePasses.id, passId))

    await ctx.tx.insert(accessLogs).values({
      entryType: 'qr',
      result: 'allowed',
      authorizedBy: session.user.id,
      visitorName: pass.description ?? 'Pase temporal',
      unitId: body.unitId,
      tenantId: session.tenantId,
      vehiclePassId: passId,
      occupantCount: body.occupantCount ?? null,
      passToken: pass.token,
      createdAt: ctx.now,
    })

    return { data: { assigned: true, unitNumber: unit.number, unitLabel: unit.label } }
  })
})
