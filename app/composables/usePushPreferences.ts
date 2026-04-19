import type { PushCategory, PushPreferences } from '~~/shared/types/push-preferences'

/**
 * Composable para gestionar preferencias de notificaciones push por categoría.
 * Carga las preferencias del usuario y permite togglear categorías individuales.
 */
export function usePushPreferences() {
  const preferences = ref<PushPreferences | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  async function fetchPreferences() {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ data: PushPreferences }>('/api/me/push-preferences')
      preferences.value = response.data
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al cargar preferencias'
    } finally {
      isLoading.value = false
    }
  }

  async function toggleCategory(category: PushCategory, enabled: boolean) {
    if (!preferences.value) return

    // Optimistic update
    const previous = preferences.value[category]
    preferences.value[category] = enabled
    isSaving.value = true
    error.value = null

    try {
      const response = await $fetch<{ data: PushPreferences }>('/api/me/push-preferences', {
        method: 'PATCH',
        body: { [category]: enabled },
      })
      preferences.value = response.data
    } catch (e: unknown) {
      // Rollback on error
      if (preferences.value) {
        preferences.value[category] = previous
      }
      error.value = e instanceof Error ? e.message : 'Error al actualizar preferencia'
    } finally {
      isSaving.value = false
    }
  }

  return {
    preferences,
    isLoading,
    isSaving,
    error,
    fetchPreferences,
    toggleCategory,
  }
}
