import { z } from 'zod'
import { db } from '~~/server/db'
import { providers } from '~~/server/db/schema/provider'
import { sendPushToRole } from '~~/server/utils/web-push'
import { PROVIDER_CATEGORY_KEYS, type Provider } from '~~/shared/types/provider'

// serviceRoleId es la categoría vigente. `category` (enum legado) se acepta
// solo por compatibilidad con clientes anteriores.
const suggestProviderSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(200, 'El nombre no puede exceder 200 caracteres'),
  phone: z.string().trim().max(50, 'El teléfono no puede exceder 50 caracteres').optional().nullable(),
  photo: z.string().optional().nullable(),
  schedule: z.string().optional().nullable(),
  address: z.string().max(500, 'La dirección no puede exceder 500 caracteres').optional().nullable(),
  services: z.array(z.string()).optional().nullable(),
  costs: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  category: z.enum(PROVIDER_CATEGORY_KEYS).optional(),
  serviceRoleId: z.string().uuid('Categoría inválida').optional().nullable(),
}).refine(data => Boolean(data.serviceRoleId || data.category), {
  message: 'La categoría es requerida',
  path: ['serviceRoleId'],
})

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['propietario'])

  const body = await validateBody(event, suggestProviderSchema)

  if (body.serviceRoleId) {
    await assertProviderServiceRole(session.tenantId, body.serviceRoleId)
  }

  // Create with status 'pending' for admin review
  const rows = await db
    .insert(providers)
    .values({
      name: body.name,
      phone: body.phone || null,
      photo: body.photo?.trim() || null,
      schedule: body.schedule?.trim() || null,
      address: body.address?.trim() || null,
      services: body.services ?? null,
      costs: body.costs?.trim() || null,
      notes: body.notes?.trim() || null,
      category: body.serviceRoleId ? 'otro' : (body.category ?? 'otro'),
      serviceRoleId: body.serviceRoleId ?? null,
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
    body: `${userName} sugiere agregar: ${body.name}`,
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
