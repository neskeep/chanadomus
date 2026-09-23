import type { ZodType, ZodError } from 'zod'
import type { H3Event } from 'h3'

/**
 * Validate request body against a Zod schema.
 * Throws a 400 error with field-level details on failure.
 */
export async function validateBody<T>(event: H3Event, schema: ZodType<T>): Promise<T> {
  const body = await readBody(event)
  const result = schema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: formatZodError(result.error),
    })
  }

  return result.data
}

/**
 * Validate query parameters against a Zod schema.
 * Throws a 400 error with field-level details on failure.
 */
export function validateQuery<T>(event: H3Event, schema: ZodType<T>): T {
  const query = getQuery(event)
  const result = schema.safeParse(query)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: formatZodError(result.error),
    })
  }

  return result.data
}

/**
 * Validate route params against a Zod schema.
 */
export function validateParams<T>(event: H3Event, schema: ZodType<T>): T {
  const params = getRouterParams(event)
  const result = schema.safeParse(params)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: formatZodError(result.error),
    })
  }

  return result.data
}

/**
 * Valida `data` y lanza 400 con los mensajes de los issues, sin prefijo de campo.
 * Pensado para schemas con mensajes ya redactados para el usuario (shared/lib).
 */
export function parseOrThrow<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: zodIssueMessages(result.error),
    })
  }
  return result.data
}

/** Mensajes de un ZodError unidos por "; " (sin rutas, sin duplicados). */
export function zodIssueMessages(error: ZodError): string {
  return [...new Set(error.issues.map(issue => issue.message))].join('; ')
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** True si el valor es un UUID con formato válido (evita errores 500 de Postgres). */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ')
}
