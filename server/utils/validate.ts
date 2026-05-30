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

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ')
}
