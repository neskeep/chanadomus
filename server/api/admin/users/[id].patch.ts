import { db } from '~~/server/db'
import { user } from '~~/server/db/schema/auth'
import { staff } from '~~/server/db/schema/staff'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { eq, and } from 'drizzle-orm'
import { USER_ROLES, type UserRole } from '~~/shared/types/auth'

interface UpdateBody {
  name?: string
  email?: string
  role?: UserRole
  unitId?: string | null
  phone?: string | null
}

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)
  const id = getRouterParam(event, 'id')

  if (!id) throw createError({ statusCode: 400, message: 'ID requerido' })

  const body = await readBody<UpdateBody>(event)

  if (body.role && !USER_ROLES.includes(body.role)) {
    throw createError({ statusCode: 400, message: 'Rol invalido' })
  }

  // Propietarios y conserjes requieren unidad obligatoria
  const ROLES_REQUIRING_UNIT: UserRole[] = ['propietario', 'conserje']

  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.email !== undefined) updates.email = body.email.trim().toLowerCase()
  if (body.role !== undefined) updates.role = body.role
  if (body.unitId !== undefined) updates.unitId = body.unitId || null
  if (body.phone !== undefined) updates.phone = body.phone?.trim() || null

  // Validate unit requirement based on effective role
  const effectiveRole = (body.role ?? undefined) as UserRole | undefined
  if (effectiveRole && ROLES_REQUIRING_UNIT.includes(effectiveRole)) {
    const effectiveUnitId = body.unitId !== undefined ? body.unitId : undefined
    if (effectiveUnitId === null || effectiveUnitId === '') {
      throw createError({ statusCode: 400, message: 'Este rol requiere una unidad asignada' })
    }
    if (effectiveUnitId === undefined) {
      const [existing] = await db
        .select({ unitId: user.unitId })
        .from(user)
        .where(and(eq(user.id, id), eq(user.tenantId, tenantId)))
        .limit(1)
      if (!existing?.unitId) {
        throw createError({ statusCode: 400, message: 'Este rol requiere una unidad asignada' })
      }
    }
  }
  // If removing unit, check current role doesn't require it
  if (body.unitId !== undefined && !body.unitId && body.role === undefined) {
    const [existing] = await db
      .select({ role: user.role })
      .from(user)
      .where(and(eq(user.id, id), eq(user.tenantId, tenantId)))
      .limit(1)
    if (existing?.role && ROLES_REQUIRING_UNIT.includes(existing.role as UserRole)) {
      throw createError({ statusCode: 400, message: 'Este rol requiere una unidad asignada' })
    }
  }

  if (Object.keys(updates).length === 1) {
    throw createError({ statusCode: 400, message: 'No se proporcionaron campos para actualizar' })
  }

  const [updated] = await db
    .update(user)
    .set(updates)
    .where(and(eq(user.id, id), eq(user.tenantId, tenantId)))
    .returning()

  if (!updated) throw createError({ statusCode: 404, message: 'Usuario no encontrado' })

  // Auto-create staff record if role changed to conserje/vigilancia and no staff exists
  const STAFF_ROLES: UserRole[] = ['conserje', 'vigilancia']
  const effectiveRoleForStaff = (updated.role ?? '') as UserRole
  if (STAFF_ROLES.includes(effectiveRoleForStaff)) {
    const [existingStaff] = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.userId, id), eq(staff.tenantId, tenantId)))
      .limit(1)

    if (!existingStaff) {
      const [matchingRole] = await db
        .select({ id: serviceStaffRoles.id })
        .from(serviceStaffRoles)
        .where(
          and(
            eq(serviceStaffRoles.tenantId, tenantId),
            eq(serviceStaffRoles.name, effectiveRoleForStaff === 'conserje' ? 'Conserje' : 'Vigilancia'),
          ),
        )

      await db.insert(staff).values({
        name: updated.name,
        role: effectiveRoleForStaff as 'conserje' | 'vigilancia',
        roleId: matchingRole?.id ?? null,
        phone: updated.phone || null,
        userId: id,
        unitId: updated.unitId || null,
        qrToken: crypto.randomUUID(),
        tenantId,
      })
    }
    else {
      // Update existing staff record to sync unit and name
      await db
        .update(staff)
        .set({
          unitId: updated.unitId || null,
          name: updated.name,
          role: effectiveRoleForStaff as 'conserje' | 'vigilancia',
        })
        .where(and(eq(staff.userId, id), eq(staff.tenantId, tenantId)))
    }
  }

  return { data: updated }
})
