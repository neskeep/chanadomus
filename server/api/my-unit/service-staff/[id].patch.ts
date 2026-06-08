import { db } from '~~/server/db'
import { unitServiceStaff } from '~~/server/db/schema/unit-service-staff'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { staff } from '~~/server/db/schema/staff'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const { tenantId } = session
  const unitId = (session.user as Record<string, unknown>).unitId as string

  if (!unitId) {
    throw createError({ statusCode: 403, message: 'Usuario sin unidad asignada' })
  }

  const staffId = getRouterParam(event, 'id')
  if (!staffId) {
    throw createError({ statusCode: 400, message: 'Staff ID es requerido' })
  }

  const body = await readBody<{
    name?: string
    roleId?: string
    idDocument?: string | null
    phone?: string | null
  }>(event)

  if (body.name !== undefined && !body.name?.trim()) {
    throw createError({ statusCode: 400, message: 'El nombre no puede estar vacío' })
  }

  // Check if this is a staff record (conserje)
  const [staffRecord] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(
      and(
        eq(staff.id, staffId),
        eq(staff.unitId, unitId),
        eq(staff.tenantId, tenantId),
        eq(staff.role, 'conserje'),
      ),
    )
    .limit(1)

  if (staffRecord) {
    // Staff record: only allow name, phone, idDocument updates
    const staffUpdateData: Record<string, unknown> = {}
    if (body.name) staffUpdateData.name = body.name.trim()
    if (body.idDocument !== undefined) staffUpdateData.idDocument = body.idDocument
    if (body.phone !== undefined) staffUpdateData.phone = body.phone

    if (Object.keys(staffUpdateData).length === 0) {
      throw createError({ statusCode: 400, message: 'No hay campos para actualizar' })
    }

    const [updated] = await db
      .update(staff)
      .set(staffUpdateData)
      .where(
        and(
          eq(staff.id, staffId),
          eq(staff.unitId, unitId),
          eq(staff.tenantId, tenantId),
        ),
      )
      .returning()

    if (!updated) {
      throw createError({ statusCode: 404, message: 'Personal de servicio no encontrado' })
    }

    return { data: updated }
  }

  // Unit service staff record: keep original behavior
  // Validate roleId if provided
  if (body.roleId) {
    const [role] = await db
      .select({ id: serviceStaffRoles.id })
      .from(serviceStaffRoles)
      .where(and(eq(serviceStaffRoles.id, body.roleId), eq(serviceStaffRoles.tenantId, tenantId)))

    if (!role) {
      throw createError({ statusCode: 400, message: 'Rol no válido' })
    }
  }

  const updateData: Record<string, unknown> = {}
  if (body.name) updateData.name = body.name.trim()
  if (body.roleId) updateData.roleId = body.roleId
  if (body.idDocument !== undefined) updateData.idDocument = body.idDocument
  if (body.phone !== undefined) updateData.phone = body.phone

  if (Object.keys(updateData).length === 0) {
    throw createError({ statusCode: 400, message: 'No hay campos para actualizar' })
  }

  const [updated] = await db
    .update(unitServiceStaff)
    .set(updateData)
    .where(
      and(
        eq(unitServiceStaff.id, staffId),
        eq(unitServiceStaff.unitId, unitId),
        eq(unitServiceStaff.tenantId, tenantId),
      ),
    )
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Personal de servicio no encontrado' })
  }

  return { data: updated }
})
