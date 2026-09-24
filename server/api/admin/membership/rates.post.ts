import { db } from '~~/server/db'
import { membershipRates } from '~~/server/db/schema/membership'
import { membershipRateInputSchema } from '~~/shared/lib/membership'
import type { MembershipRate } from '~~/shared/types/membership'

/**
 * POST /api/admin/membership/rates  (solo superadmin)
 * Programa una tarifa nueva desde `effectiveFrom` (día 01). No toca los meses
 * ya cerrados: cada cierre guarda su propia copia de la tarifa.
 */
export default defineEventHandler(async (event): Promise<{ data: MembershipRate }> => {
  await requireRole(event, ['admin'])
  const session = await requireSuperAdmin(event)
  const input = parseOrThrow(membershipRateInputSchema, await readBody(event))

  const [row] = await db
    .insert(membershipRates)
    .values({
      tenantId: session.tenantId,
      fullRate: input.fullRate.toFixed(2),
      reducedRate: input.reducedRate.toFixed(2),
      currency: input.currency,
      effectiveFrom: input.effectiveFrom,
      notes: input.notes,
      createdById: session.user.id,
    })
    .returning({ id: membershipRates.id })

  const created = (await listMembershipRates(session.tenantId)).find(rate => rate.id === row!.id)
  if (!created) throw createError({ statusCode: 500, message: 'No se pudo leer la tarifa guardada' })

  setResponseStatus(event, 201)
  return { data: created }
})
