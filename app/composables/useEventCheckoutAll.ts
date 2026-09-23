import type { BulkCheckoutResult } from '~~/shared/types/event'

/**
 * Salida masiva de los invitados que siguen dentro de un evento
 * (POST /api/events/:id/checkout/all). Lo usan vigilancia, conserje y admin.
 *
 * No toca la lista local: la vista recarga sus invitados en `onDone` para traer
 * hora y autor de cada salida tal como quedaron en el servidor.
 */
export function useEventCheckoutAll(
  eventId: MaybeRefOrGetter<string>,
  onDone?: (result: BulkCheckoutResult) => void | Promise<void>,
) {
  const isCheckingOutAll = ref(false)
  const error = ref<string | null>(null)

  async function checkoutAll(): Promise<BulkCheckoutResult | null> {
    if (isCheckingOutAll.value) return null
    isCheckingOutAll.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: BulkCheckoutResult }>(
        `/api/events/${toValue(eventId)}/checkout/all`,
        { method: 'POST' },
      )
      await onDone?.(res.data)
      return res.data
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'No se pudo registrar la salida de todos')
      throw err
    }
    finally {
      isCheckingOutAll.value = false
    }
  }

  return { isCheckingOutAll, error, checkoutAll }
}
