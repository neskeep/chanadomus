import { z } from 'zod'
import { db } from '~~/server/db'
import { providers } from '~~/server/db/schema/provider'
import type { Provider } from '~~/shared/types/provider'

const createProviderSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200, 'El nombre no puede exceder 200 caracteres'),
  phone: z.string().max(50, 'El telefono no puede exceder 50 caracteres').optional().nullable(),
  photo: z.string().optional().nullable(),
  schedule: z.string().optional().nullable(),
  address: z.string().max(500, 'La direccion no puede exceder 500 caracteres').optional().nullable(),
  services: z.array(z.string()).optional().nullable(),
  costs: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  category: z.enum(['plomeria', 'electricidad', 'jardineria', 'cerrajeria', 'limpieza', 'pintura', 'albanileria', 'seguridad', 'fumigacion', 'otro']).optional(),
  serviceRoleId: z.string().optional().nullable(),
}).refine((data) => {
  if (!data.serviceRoleId && !data.category) return false
  return true
}, { message: 'La categoria es requerida', path: ['category'] })

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin', 'conserje'])

  const body = await validateBody(event, createProviderSchema)

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
