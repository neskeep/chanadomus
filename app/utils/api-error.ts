import type { FetchError } from 'ofetch'

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const fetchErr = err as FetchError
    if (typeof fetchErr.data?.message === 'string') {
      return fetchErr.data.message
    }
    if (typeof fetchErr.statusMessage === 'string' && fetchErr.statusMessage !== 'Server Error') {
      return fetchErr.statusMessage
    }
  }
  if (err instanceof Error) {
    return err.message
  }
  return fallback
}

/** Código HTTP de un error de $fetch, o undefined si no vino del servidor. */
export function getApiErrorStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object') {
    const { statusCode, status } = err as { statusCode?: unknown; status?: unknown }
    if (typeof statusCode === 'number') return statusCode
    if (typeof status === 'number') return status
  }
  return undefined
}
