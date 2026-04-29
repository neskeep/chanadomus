import { eq } from 'drizzle-orm'
import { db } from '~~/server/db'
import { accessLogs } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import type { AccessEvent } from '~~/shared/types/access'
import { broadcastAccessEvent } from '~~/server/utils/ws-access'

interface ManualEntryBody {
  visitorName: string
  visitorDocument?: string
  unitId: string
  visitorType: 'invitado' | 'proveedor'
  vehiclePlate?: string
  result: 'allowed' | 'denied'
}

export default defineEventHandler(async (event) => {
  // 1. Auth: only conserje and admin
  const session = await requireRole(event, ['conserje', 'vigilancia', 'admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string | undefined

  if (!tenantId) {
    throw createError({ statusCode: 403, message: 'Usuario sin tenant asignado' })
  }

  // 2. Parse and validate body
  const body = await readBody<ManualEntryBody>(event)

  if (!body.visitorName?.trim()) {
    throw createError({ statusCode: 400, message: 'visitorName es requerido' })
  }
  if (!body.unitId?.trim()) {
    throw createError({ statusCode: 400, message: 'unitId es requerido' })
  }
  if (!body.result || !['allowed', 'denied'].includes(body.result)) {
    throw createError({ statusCode: 400, message: 'result debe ser allowed o denied' })
  }

  // 3. Build notes from vehiclePlate if present
  const notes = body.vehiclePlate?.trim()
    ? `Placa: ${body.vehiclePlate.trim()}`
    : null

  // 4. Create access log
  const manualLogs = await db
    .insert(accessLogs)
    .values({
      entryType: 'manual',
      authorizedBy: session.user.id,
      visitorName: body.visitorName.trim(),
      visitorDocument: body.visitorDocument?.trim() ?? null,
      unitId: body.unitId,
      result: body.result,
      tenantId,
      notes,
    })
    .returning({ id: accessLogs.id, createdAt: accessLogs.createdAt })

  const log = manualLogs[0]!

  // 5. Get unit info for the event
  const [unit] = await db
    .select({
      number: units.number,
      label: units.label,
    })
    .from(units)
    .where(eq(units.id, body.unitId))
    .limit(1)

  // 6. Broadcast event
  const accessEvent: AccessEvent = {
    id: log.id,
    entryType: 'manual',
    result: body.result,
    visitorName: body.visitorName.trim(),
    visitorDocument: body.visitorDocument?.trim() ?? null,
    unitNumber: unit?.number ?? null,
    unitLabel: unit?.label ?? null,
    notes,
    exitAt: null,
    createdAt: log.createdAt.toISOString(),
  }

  broadcastAccessEvent(accessEvent)

  return { data: accessEvent }
})
