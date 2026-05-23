import { db } from '~~/server/db'
import { staff } from '~~/server/db/schema/staff'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { eq, and } from 'drizzle-orm'

interface StaffUpdateBody {
  name?: string
  roleId?: string
  idDocument?: string
  phone?: string
  email?: string
  shift?: string
  userId?: string
  unitId?: string | null
}

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  const body = await readBody<StaffUpdateBody>(event)

  const updates: Record<string, unknown> = {}

  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.roleId !== undefined) {
    // Validate roleId belongs to tenant
    const [role] = await db
      .select({ id: serviceStaffRoles.id, name: serviceStaffRoles.name })
      .from(serviceStaffRoles)
      .where(and(eq(serviceStaffRoles.id, body.roleId), eq(serviceStaffRoles.tenantId, tenantId)))

    if (!role) {
      throw createError({ statusCode: 400, message: 'Rol no encontrado' })
    }

    updates.roleId = body.roleId
    // Keep legacy enum in sync
    const legacyRoleMap: Record<string, string> = {
      conserje: 'conserje', vigilancia: 'vigilancia',
      mantenimiento: 'mantenimiento',
    }
    const legacyRole = legacyRoleMap[role.name.toLowerCase()] ?? 'otro'
    updates.role = legacyRole

    // Conserjes requieren unidad obligatoria
    if (legacyRole === 'conserje') {
      const effectiveUnitId = body.unitId !== undefined ? body.unitId : undefined
      if (effectiveUnitId === null || effectiveUnitId === '') {
        throw createError({ statusCode: 400, message: 'Los conserjes deben tener una unidad asignada' })
      }
      // If unitId not in body, check existing record has one
      if (effectiveUnitId === undefined) {
        const [existing] = await db
          .select({ unitId: staff.unitId })
          .from(staff)
          .where(and(eq(staff.id, id), eq(staff.tenantId, tenantId)))
          .limit(1)
        if (!existing?.unitId) {
          throw createError({ statusCode: 400, message: 'Los conserjes deben tener una unidad asignada' })
        }
      }
    }
  }
  if (body.idDocument !== undefined) updates.idDocument = body.idDocument?.trim() || null
  if (body.phone !== undefined) updates.phone = body.phone?.trim() || null
  if (body.email !== undefined) updates.email = body.email?.trim() || null
  if (body.shift !== undefined) updates.shift = body.shift?.trim() || null
  if (body.userId !== undefined) updates.userId = body.userId || null
  if (body.unitId !== undefined) updates.unitId = body.unitId || null

  // If removing unit but role is conserje, block it
  if (body.unitId !== undefined && !body.unitId && body.roleId === undefined) {
    const [existing] = await db
      .select({ role: staff.role })
      .from(staff)
      .where(and(eq(staff.id, id), eq(staff.tenantId, tenantId)))
      .limit(1)
    if (existing?.role === 'conserje') {
      throw createError({ statusCode: 400, message: 'Los conserjes deben tener una unidad asignada' })
    }
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No se proporcionaron campos para actualizar' })
  }

  const [updated] = await db
    .update(staff)
    .set(updates)
    .where(and(eq(staff.id, id), eq(staff.tenantId, tenantId)))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Personal no encontrado' })
  }

  return { data: updated }
})
