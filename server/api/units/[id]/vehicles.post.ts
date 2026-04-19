import { db } from '~~/server/db'
import { vehicles } from '~~/server/db/schema/vehicle'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const unitId = getRouterParam(event, 'id')
  if (!unitId) {
    throw createError({ statusCode: 400, message: 'Unit ID is required' })
  }

  const body = await readBody<{
    plate?: string
    brand?: string
    model?: string
    color?: string
    ownerMemberId?: string
  }>(event)

  if (!body.plate?.trim() || !body.brand?.trim() || !body.model?.trim() || !body.color?.trim()) {
    throw createError({ statusCode: 400, message: 'plate, brand, model, and color are required' })
  }

  const [inserted] = await db
    .insert(vehicles)
    .values({
      unitId,
      plate: body.plate.trim().toUpperCase(),
      brand: body.brand.trim(),
      model: body.model.trim(),
      color: body.color.trim(),
      ownerMemberId: body.ownerMemberId || null,
      tenantId,
    })
    .returning()

  setResponseStatus(event, 201)
  return { data: inserted }
})
