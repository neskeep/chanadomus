import { db } from '~~/server/db'
import { providers } from '~~/server/db/schema/provider'
import { sendPushToRole } from '~~/server/utils/web-push'
import type { Provider, ProviderCategory, CreateProvider } from '~~/shared/types/provider'

const VALID_CATEGORIES: ProviderCategory[] = [
  'plomeria', 'electricidad', 'jardineria', 'cerrajeria', 'limpieza',
  'pintura', 'albanileria', 'seguridad', 'fumigacion', 'otro',
]

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['propietario'])

  const body = await readBody<CreateProvider>(event)

  // Validate required fields
  if (!body.name || !body.name.trim()) {
    throw createError({ statusCode: 400, message: 'El nombre es requerido' })
  }
  if (body.name.trim().length > 200) {
    throw createError({ statusCode: 400, message: 'El nombre no puede exceder 200 caracteres' })
  }
  if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
    throw createError({ statusCode: 400, message: 'La categoria es requerida y debe ser valida' })
  }

  // Validate optional fields
  if (body.phone && body.phone.length > 50) {
    throw createError({ statusCode: 400, message: 'El telefono no puede exceder 50 caracteres' })
  }

  // Create with status 'pending' for admin review
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
      category: body.category,
      status: 'pending',
      createdById: session.user.id,
      tenantId: session.tenantId,
    })
    .returning()

  const row = rows[0]
  if (!row) {
    throw createError({ statusCode: 500, message: 'Error al crear la sugerencia' })
  }

  // Notify admins about new suggestion
  const userName = session.user.name ?? 'Un propietario'
  await sendPushToRole(session.tenantId, 'admin', {
    title: 'Sugerencia de proveedor',
    body: `${userName} sugiere agregar: ${body.name.trim()}`,
    url: '/admin/proveedores',
  }).catch(() => {
    // Push failure should not block the response
  })

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
