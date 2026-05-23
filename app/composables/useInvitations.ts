import type { Invitation } from '~~/shared/types/invitation'

export function useInvitations(unitId: string) {
  const invitations = ref<Invitation[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  const pendingInvitations = computed(() =>
    invitations.value.filter(i => i.status === 'pending'),
  )

  async function fetchInvitations() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Invitation[] }>(
        '/api/admin/invitations',
        { params: { unitId } },
      )
      invitations.value = res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar invitaciones'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function createInvitation(role: 'propietario' | 'conserje') {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: { id: string, token: string, expiresAt: string } }>(
        '/api/admin/invitations',
        {
          method: 'POST',
          body: { unitId, role },
        },
      )
      await fetchInvitations()
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear invitación'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function revokeInvitation(id: string) {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch(`/api/admin/invitations/${id}`, {
        method: 'DELETE',
      })
      await fetchInvitations()
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al revocar invitación'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    invitations,
    pendingInvitations,
    isLoading,
    isSubmitting,
    error,
    fetchInvitations,
    createInvitation,
    revokeInvitation,
  }
}
