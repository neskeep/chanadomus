import { eq } from 'drizzle-orm'
import { db } from '~~/server/db'
import { accessLogs } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import type { AccessEvent } from '~~/shared/types/access'
import { broadcastAccessEvent } from '~~/server/utils/ws-access'

interface ManualEntryBody {
  visitorName: string
  visitorDocument?: string
  unitId?: string
  visitorType: 'invitado' | 'proveedor'
  vehiclePlate?: string
  customDestination?: string
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
  if (!body.unitId?.trim() && !body.customDestination?.trim()) {
    throw createError({ statusCode: 400, message: 'unitId o customDestination es requerido' })
  }
  if (!body.result || !['allowed', 'denied'].includes(body.result)) {
    throw createError({ statusCode: 400, message: 'result debe ser allowed o denied' })
  }

  // 3. Build notes from customDestination and vehiclePlate
  const noteParts: string[] = []
  if (body.customDestination?.trim()) {
    noteParts.push(`Destino: ${body.customDestination.trim()}`)
  }
  if (body.vehiclePlate?.trim()) {
    noteParts.push(`Placa: ${body.vehiclePlate.trim()}`)
  }
  const notes = noteParts.length > 0 ? noteParts.join(' | ') : null

  // 4. Create access log
  const manualLogs = await db
    .insert(accessLogs)
    .values({
      entryType: 'manual',
      authorizedBy: session.user.id,
      visitorName: body.visitorName.trim(),
      visitorDocument: body.visitorDocument?.trim() ?? null,
      unitId: body.unitId?.trim() || null,
      result: body.result,
      tenantId,
      notes,
    })
    .returning({ id: accessLogs.id, createdAt: accessLogs.createdAt })

  const log = manualLogs[0]!

  // 5. Get unit info for the event (only if unitId provided)
  let unitNumber: string | null = null
  let unitLabel: string | null = null

  if (body.unitId?.trim()) {
    const [unit] = await db
      .select({
        number: units.number,
        label: units.label,
      })
      .from(units)
      .where(eq(units.id, body.unitId))
      .limit(1)

    unitNumber = unit?.number ?? null
    unitLabel = unit?.label ?? null
  }

  // 6. Broadcast event
  const accessEvent: AccessEvent = {
    id: log.id,
    entryType: 'manual',
    result: body.result,
    visitorName: body.visitorName.trim(),
    visitorDocument: body.visitorDocument?.trim() ?? null,
    unitNumber,
    unitLabel,
    notes,
    exitAt: null,
    createdAt: log.createdAt.toISOString(),
  }

  broadcastAccessEvent(accessEvent)

  return { data: accessEvent }
})
