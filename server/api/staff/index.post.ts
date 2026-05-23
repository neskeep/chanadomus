import { db } from '~~/server/db'
import { staff } from '~~/server/db/schema/staff'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { eq, and } from 'drizzle-orm'

interface StaffCreateBody {
  name: string
  roleId: string
  idDocument?: string
  phone?: string
  email?: string
  shift?: string
  userId?: string
  unitId?: string
}

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const body = await readBody<StaffCreateBody>(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, message: 'El nombre es requerido' })
  }
  if (!body.roleId) {
    throw createError({ statusCode: 400, message: 'El rol es requerido' })
  }

  // Validate roleId exists and belongs to tenant
  const [role] = await db
    .select({ id: serviceStaffRoles.id, name: serviceStaffRoles.name })
    .from(serviceStaffRoles)
    .where(and(eq(serviceStaffRoles.id, body.roleId), eq(serviceStaffRoles.tenantId, tenantId)))

  if (!role) {
    throw createError({ statusCode: 400, message: 'Rol no encontrado' })
  }

  // Map role name to legacy enum for backward compat
  const legacyRoleMap: Record<string, string> = {
    conserje: 'conserje', vigilancia: 'vigilancia',
    mantenimiento: 'mantenimiento',
  }
  const legacyRole = legacyRoleMap[role.name.toLowerCase()] ?? 'otro'

  // Conserjes requieren unidad obligatoria
  if (legacyRole === 'conserje' && !body.unitId) {
    throw createError({ statusCode: 400, message: 'Los conserjes deben tener una unidad asignada' })
  }

  const [inserted] = await db
    .insert(staff)
    .values({
      name: body.name.trim(),
      role: legacyRole as 'conserje' | 'vigilancia' | 'mantenimiento' | 'otro',
      roleId: body.roleId,
      idDocument: body.idDocument?.trim() || null,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      shift: body.shift?.trim() || null,
      userId: body.userId || null,
      unitId: body.unitId || null,
      tenantId,
    })
    .returning()

  setResponseStatus(event, 201)
  return { data: inserted }
})
