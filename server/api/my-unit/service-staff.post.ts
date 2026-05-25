import { db } from '~~/server/db'
import { unitServiceStaff } from '~~/server/db/schema/unit-service-staff'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const tenantId = (session.user as Record<string, unknown>).tenantId as string
  const unitId = (session.user as Record<string, unknown>).unitId as string

  if (!unitId) {
    throw createError({ statusCode: 403, message: 'Usuario sin unidad asignada' })
  }

  const body = await readBody<{
    name?: string
    roleId?: string
    idDocument?: string
    phone?: string
  }>(event)

  if (!body.name || !body.name.trim()) {
    throw createError({ statusCode: 400, message: 'El nombre es requerido' })
  }

  if (!body.roleId) {
    throw createError({ statusCode: 400, message: 'El rol es requerido' })
  }

  // Verify role exists and belongs to tenant
  const [role] = await db
    .select({ id: serviceStaffRoles.id })
    .from(serviceStaffRoles)
    .where(and(eq(serviceStaffRoles.id, body.roleId), eq(serviceStaffRoles.tenantId, tenantId)))

  if (!role) {
    throw createError({ statusCode: 400, message: 'Rol no válido' })
  }

  if (!body.idDocument || !body.idDocument.trim()) {
    throw createError({ statusCode: 400, message: 'El documento de identidad es requerido' })
  }

  const [inserted] = await db
    .insert(unitServiceStaff)
    .values({
      unitId,
      name: body.name.trim(),
      roleId: body.roleId,
      idDocument: body.idDocument ?? null,
      phone: body.phone ?? null,
      tenantId,
    })
    .returning()

  setResponseStatus(event, 201)
  return { data: inserted }
})
