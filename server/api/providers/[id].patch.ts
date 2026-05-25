import { db } from '~~/server/db'
import { providers } from '~~/server/db/schema/provider'
import { eq, and } from 'drizzle-orm'
import type { Provider, ProviderCategory, ProviderStatus, UpdateProvider } from '~~/shared/types/provider'

const VALID_CATEGORIES: ProviderCategory[] = [
  'plomeria', 'electricidad', 'jardineria', 'cerrajeria', 'limpieza',
  'pintura', 'albanileria', 'seguridad', 'fumigacion', 'otro',
]
const VALID_STATUSES: ProviderStatus[] = ['active', 'inactive', 'pending']

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin', 'conserje'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID del proveedor es requerido' })
  }

  const body = await readBody<UpdateProvider>(event)

  // Validate fields if provided
  if (body.name !== undefined) {
    if (!body.name || !body.name.trim()) {
      throw createError({ statusCode: 400, message: 'El nombre no puede estar vacio' })
    }
    if (body.name.trim().length > 200) {
      throw createError({ statusCode: 400, message: 'El nombre no puede exceder 200 caracteres' })
    }
  }
  if (body.category !== undefined && !VALID_CATEGORIES.includes(body.category)) {
    throw createError({ statusCode: 400, message: 'Categoria invalida' })
  }
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    throw createError({ statusCode: 400, message: 'Estado invalido' })
  }
  if (body.phone !== undefined && body.phone && body.phone.length > 50) {
    throw createError({ statusCode: 400, message: 'El telefono no puede exceder 50 caracteres' })
  }

  // Check provider exists and belongs to tenant
  const [existing] = await db
    .select({ id: providers.id })
    .from(providers)
    .where(and(eq(providers.id, id), eq(providers.tenantId, session.tenantId)))

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Proveedor no encontrado' })
  }

  // Build update values
  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  }
  if (body.name !== undefined) updateValues.name = body.name.trim()
  if (body.phone !== undefined) updateValues.phone = body.phone?.trim() || null
  if (body.photo !== undefined) updateValues.photo = body.photo?.trim() || null
  if (body.schedule !== undefined) updateValues.schedule = body.schedule?.trim() || null
  if (body.address !== undefined) updateValues.address = body.address?.trim() || null
  if (body.services !== undefined) updateValues.services = body.services
  if (body.costs !== undefined) updateValues.costs = body.costs?.trim() || null
  if (body.notes !== undefined) updateValues.notes = body.notes?.trim() || null
  if (body.category !== undefined) updateValues.category = body.category
  if (body.serviceRoleId !== undefined) updateValues.serviceRoleId = body.serviceRoleId || null
  if (body.status !== undefined) updateValues.status = body.status

  const rows = await db
    .update(providers)
    .set(updateValues)
    .where(and(eq(providers.id, id), eq(providers.tenantId, session.tenantId)))
    .returning()

  const row = rows[0]
  if (!row) {
    throw createError({ statusCode: 500, message: 'Error al actualizar el proveedor' })
  }

  const data: Provider = {
    id: row.id,
    name: row.name,
    phone: row.phone,
    photo: row.photo,
    schedule: row.schedule,
    address: row.address,
    services: row.services,
    costs: row.costs,
    notes: row.notes,
    category: row.category,
    serviceRoleId: row.serviceRoleId,
    status: row.status,
    createdById: row.createdById,
    tenantId: row.tenantId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }

  return { data }
})
