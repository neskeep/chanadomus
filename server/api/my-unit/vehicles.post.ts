import { db } from '~~/server/db'
import { vehicles } from '~~/server/db/schema/vehicle'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const tenantId = (session.user as Record<string, unknown>).tenantId as string
  const unitId = (session.user as Record<string, unknown>).unitId as string

  if (!unitId) {
    throw createError({ statusCode: 403, message: 'Usuario sin unidad asignada' })
  }

  const body = await readBody<{
    plate?: string
    brand?: string
    model?: string
    color?: string
    ownerMemberId?: string
  }>(event)

  if (!body.plate || !body.plate.trim()) {
    throw createError({ statusCode: 400, message: 'La placa es requerida' })
  }

  if (!body.brand || !body.brand.trim()) {
    throw createError({ statusCode: 400, message: 'La marca es requerida' })
  }

  if (!body.model || !body.model.trim()) {
    throw createError({ statusCode: 400, message: 'El modelo es requerido' })
  }

  if (!body.color || !body.color.trim()) {
    throw createError({ statusCode: 400, message: 'El color es requerido' })
  }

  const [inserted] = await db
    .insert(vehicles)
    .values({
      unitId,
      plate: body.plate.trim().toUpperCase(),
      brand: body.brand.trim(),
      model: body.model.trim(),
      color: body.color.trim(),
      ownerMemberId: body.ownerMemberId ?? null,
      tenantId,
    })
    .returning()

  setResponseStatus(event, 201)
  return { data: inserted }
})
