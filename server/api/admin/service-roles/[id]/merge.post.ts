import { serviceRoleMergeBodySchema } from '~~/server/utils/service-role-merge-rules'

// Fusiona un rol de servicio duplicado en otro: mueve todas sus referencias y lo desactiva.
export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const sourceId = getRouterParam(event, 'id')
  if (!isUuid(sourceId)) {
    throw createError({ statusCode: 400, message: 'El rol que quieres fusionar no es válido' })
  }

  const { targetId } = parseOrThrow(serviceRoleMergeBodySchema, await readBody(event))

  const result = await mergeServiceRole(tenantId, sourceId, targetId)
  return { data: result }
})
