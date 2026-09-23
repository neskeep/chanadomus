/**
 * Reglas puras de la fusión de roles de servicio (sin DB, testeables con vitest).
 * La parte transaccional vive en service-role-merge.ts y usa estas reglas.
 */
import { z } from 'zod'

export const serviceRoleMergeBodySchema = z.object({
  targetId: z.string({ error: 'Indica el rol destino' }).uuid('El rol destino no es válido'),
}, { error: 'Indica el rol destino' })

export type ServiceRoleMergeBody = z.infer<typeof serviceRoleMergeBodySchema>

/** Campos del rol que intervienen en la validación y en el ajuste del destino. */
export interface ServiceRoleMergeCandidate {
  id: string
  name: string
  description: string | null
  isActive: boolean
  appliesToStaff: boolean
  appliesToProviders: boolean
  tenantId: string
}

export interface ServiceRoleMergeProblem {
  statusCode: 400 | 404
  message: string
}

/**
 * Comprueba que la fusión es posible. Devuelve el primer problema encontrado o null.
 * Los roles llegan ya filtrados por tenant desde la DB; aun así se compara tenantId
 * para que la regla no dependa de cómo se consultaron.
 */
export function findServiceRoleMergeProblem(
  sourceId: string,
  targetId: string,
  source: ServiceRoleMergeCandidate | undefined,
  target: ServiceRoleMergeCandidate | undefined,
): ServiceRoleMergeProblem | null {
  if (sourceId === targetId) {
    return { statusCode: 400, message: 'Elige un rol destino distinto al que quieres fusionar' }
  }
  if (!source) {
    return { statusCode: 404, message: 'No encontramos el rol que quieres fusionar' }
  }
  if (!target) {
    return { statusCode: 404, message: 'No encontramos el rol destino' }
  }
  if (source.tenantId !== target.tenantId) {
    return { statusCode: 400, message: 'Los dos roles deben pertenecer al mismo condominio' }
  }
  if (!target.isActive) {
    return { statusCode: 400, message: 'El rol destino está inactivo. Actívalo antes de fusionar' }
  }
  return null
}

/** Prefijo que marca un rol fusionado. */
export function mergedIntoLabel(targetName: string): string {
  return `Fusionado en ${targetName.trim()}`
}

/**
 * Descripción del rol origen tras la fusión. Conserva la anterior concatenada y no
 * repite la marca si el rol ya se había fusionado en el mismo destino.
 */
export function buildMergedDescription(previous: string | null, targetName: string): string {
  const label = mergedIntoLabel(targetName)
  const prev = previous?.trim() ?? ''
  if (!prev) return label
  if (prev.startsWith(label)) return prev
  return `${label}. ${prev}`
}

/**
 * Flags que hay que encender en el destino para que siga cubriendo todo lo que
 * cubría el origen. También se encienden si se movieron filas de ese tipo aunque el
 * origen tuviera el flag apagado (datos antiguos), para que la categoría no quede
 * huérfana en los filtros. Nunca apaga flags del destino.
 */
export function buildTargetAppliesUpdate(
  source: Pick<ServiceRoleMergeCandidate, 'appliesToStaff' | 'appliesToProviders'>,
  target: Pick<ServiceRoleMergeCandidate, 'appliesToStaff' | 'appliesToProviders'>,
  moved: { providers: number; staffRows: number } = { providers: 0, staffRows: 0 },
): { appliesToStaff?: true; appliesToProviders?: true } {
  const update: { appliesToStaff?: true; appliesToProviders?: true } = {}
  if (!target.appliesToStaff && (source.appliesToStaff || moved.staffRows > 0)) {
    update.appliesToStaff = true
  }
  if (!target.appliesToProviders && (source.appliesToProviders || moved.providers > 0)) {
    update.appliesToProviders = true
  }
  return update
}
