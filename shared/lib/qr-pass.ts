/**
 * Reglas puras de los pases de visita (qr_codes), compartidas por server y client.
 * Sin dependencias de Nuxt/Nitro ni de la DB: se testean con vitest.
 *
 * Semántica de estados (fuente única; server/utils/qr-pass.ts la traduce a SQL):
 * - canceled: tiene canceledAt. Tiene precedencia sobre todo lo demás.
 * - used:     no cancelado y (tiene usedAt, o ya venció y tuvo al menos un acceso
 *             permitido). Los pases multiuso nunca reciben usedAt: si se usaron y
 *             vencieron cuentan como usados, no como expirados.
 * - active:   no cancelado, sin usedAt y todavía no vence. Un multiuso con accesos
 *             sigue activo mientras no venza (puede volver a usarse).
 * - expired:  no cancelado, sin usedAt, vencido y sin ningún acceso permitido.
 *
 * "Acceso permitido" = fila de access_logs con result 'allowed' ligada al pase
 * (qr_code_id o pass_token). Incluye filas de solo salida: si el guardia escaneó
 * el pase, el QR ya circuló y no debe editarse.
 */
import { z } from 'zod'
import type { QrStatus } from '../types/qr'

// ─── Validación de campos (crear y editar) ───────────────────────────────────

export const QR_VISITOR_NAME_MAX = 200
export const QR_VISITOR_DOCUMENT_MAX = 50

const visitorNameSchema = z
  .string({ error: 'El nombre del visitante es requerido' })
  .trim()
  .min(1, 'El nombre del visitante es requerido')
  .max(QR_VISITOR_NAME_MAX, `El nombre no puede superar ${QR_VISITOR_NAME_MAX} caracteres`)

const visitorDocumentSchema = z
  .string({ error: 'La cédula del visitante es requerida' })
  .trim()
  .min(1, 'La cédula del visitante es requerida')
  .max(QR_VISITOR_DOCUMENT_MAX, `La cédula no puede superar ${QR_VISITOR_DOCUMENT_MAX} caracteres`)

/** Fecha ISO de vencimiento. Que sea futura se comprueba aparte (depende de `now`). */
const expiresAtSchema = z
  .string({ error: 'La fecha de vencimiento es requerida' })
  .trim()
  .min(1, 'La fecha de vencimiento es requerida')
  .refine(v => !Number.isNaN(new Date(v).getTime()), 'La fecha de vencimiento no es válida')

const optionalUuid = (message: string) => z.preprocess(
  v => (v === '' || v === null ? undefined : v),
  z.string().uuid(message).optional(),
)

/** Body de POST /api/qr/generate */
export const qrGenerateSchema = z.object({
  visitorName: visitorNameSchema,
  visitorDocument: visitorDocumentSchema,
  visitorType: z.enum(['invitado', 'proveedor'], { error: 'El tipo de visitante debe ser "invitado" o "proveedor"' }),
  unitId: z.string({ error: 'La unidad es requerida' }).uuid('La unidad no es válida'),
  expiresAt: expiresAtSchema,
  multiUse: z.boolean().optional(),
  frequentVisitorId: optionalUuid('El visitante frecuente no es válido'),
})

/** Body de PATCH /api/qr/[id]. Todos opcionales, al menos uno. El token no cambia. */
export const qrUpdateSchema = z
  .object({
    visitorName: visitorNameSchema.optional(),
    visitorDocument: visitorDocumentSchema.optional(),
    expiresAt: expiresAtSchema.optional(),
    multiUse: z.boolean().optional(),
  })
  .refine(
    v => v.visitorName !== undefined || v.visitorDocument !== undefined || v.expiresAt !== undefined || v.multiUse !== undefined,
    'No hay cambios que guardar',
  )

export type QrGenerateBody = z.infer<typeof qrGenerateSchema>
export type QrUpdateBody = z.infer<typeof qrUpdateSchema>

/** Mensaje si la fecha de vencimiento no es futura; null si es válida. */
export function qrExpiresAtError(expiresAt: Date, now: Date = new Date()): string | null {
  if (Number.isNaN(expiresAt.getTime())) return 'La fecha de vencimiento no es válida'
  if (expiresAt.getTime() <= now.getTime()) return 'La fecha de vencimiento debe ser futura'
  return null
}

// ─── Estado y permisos ───────────────────────────────────────────────────────

export interface QrPassState {
  expiresAt: Date
  usedAt: Date | null
  canceledAt: Date | null
  /** Tiene al menos un access_log 'allowed' ligado al pase */
  hasAccess: boolean
}

export function classifyQrStatus(pass: QrPassState, now: Date = new Date()): QrStatus {
  if (pass.canceledAt) return 'canceled'
  if (pass.usedAt) return 'used'
  if (pass.expiresAt.getTime() > now.getTime()) return 'active'
  return pass.hasAccess ? 'used' : 'expired'
}

/**
 * Motivo por el que el pase NO se puede cancelar, o null si se puede.
 * Misma regla que la actualización atómica de cancel.post.ts: sin cancelar,
 * sin usedAt y sin vencer. Un multiuso con accesos se puede cancelar.
 */
export function qrCancelBlockReason(pass: QrPassState, now: Date = new Date()): string | null {
  if (pass.canceledAt) return 'El pase ya fue cancelado'
  if (pass.usedAt) return 'No se puede cancelar un pase que ya fue usado'
  if (pass.expiresAt.getTime() <= now.getTime()) return 'No se puede cancelar un pase expirado'
  return null
}

/**
 * Motivo por el que el pase NO se puede editar, o null si se puede.
 * Solo se edita un pase activo que nunca se ha usado (ni usedAt ni accesos).
 */
export function qrEditBlockReason(pass: QrPassState, now: Date = new Date()): string | null {
  if (pass.canceledAt) return 'Este pase fue cancelado y no se puede editar'
  if (pass.usedAt || pass.hasAccess) {
    return qrCancelBlockReason(pass, now) === null
      ? 'Este pase ya fue usado; solo puedes cancelarlo'
      : 'Este pase ya fue usado y no se puede editar'
  }
  if (pass.expiresAt.getTime() <= now.getTime()) return 'Este pase ya venció y no se puede editar. Crea uno nuevo'
  return null
}

export interface QrPassPermissions {
  canEdit: boolean
  canCancel: boolean
}

export function qrPassPermissions(pass: QrPassState, now: Date = new Date()): QrPassPermissions {
  return {
    canEdit: qrEditBlockReason(pass, now) === null,
    canCancel: qrCancelBlockReason(pass, now) === null,
  }
}

// ─── Listado ─────────────────────────────────────────────────────────────────

export const QR_LIST_DEFAULT_LIMIT = 20
export const QR_LIST_MAX_LIMIT = 50
