import { db } from '~~/server/db'
import { providers } from '~~/server/db/schema/provider'
import type { Provider, ProviderCategory, CreateProvider } from '~~/shared/types/provider'

const VALID_CATEGORIES: ProviderCategory[] = [
  'plomeria', 'electricidad', 'jardineria', 'cerrajeria', 'limpieza',
  'pintura', 'albanileria', 'seguridad', 'fumigacion', 'otro',
]

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin', 'conserje'])

  const body = await readBody<CreateProvider>(event)

  // Validate required fields
  if (!body.name || !body.name.trim()) {
    throw createError({ statusCode: 400, message: 'El nombre es requerido' })
  }
  if (body.name.trim().length > 200) {
    throw createError({ statusCode: 400, message: 'El nombre no puede exceder 200 caracteres' })
  }
  // Category validation: accept serviceRoleId OR legacy category enum
  if (!body.serviceRoleId && (!body.category || !VALID_CATEGORIES.includes(body.category))) {
    throw createError({ statusCode: 400, message: 'La categoria es requerida' })
  }

  // Validate optional fields
  if (body.phone && body.phone.length > 50) {
    throw createError({ statusCode: 400, message: 'El telefono no puede exceder 50 caracteres' })
  }
  if (body.address && body.address.length > 500) {
    throw createError({ statusCode: 400, message: 'La direccion no puede exceder 500 caracteres' })
  }

  const rows = await db
    .insert(providers)
    .values({
      name: body.name.trim(),
      phone: body.phone?.trim() || null,
      photo: body.photo?.trim() || null,
      schedule: body.schedule?.trim() || null,
      address: body.address?.trim() || null,
      services: body.services ?? null,
      costs: body.costs?.trim() || null,
      notes: body.notes?.trim() || null,
      category: body.category ?? 'otro',
      serviceRoleId: body.serviceRoleId ?? null,
      status: 'active',
      createdById: session.user.id,
      tenantId: session.tenantId,
    })
    .returning()

  const row = rows[0]
  if (!row) {
    throw createError({ statusCode: 500, message: 'Error al crear el proveedor' })
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
    averageRating: 0,
    reviewCount: 0,
  }

  return { data }
})
