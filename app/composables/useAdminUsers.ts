import type { UserWithUnit, CreateUserPayload, UpdateUserPayload, UserRole } from '~~/shared/types/auth'

export function useAdminUsers() {
  const userList = ref<UserWithUnit[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function fetchUsers(role?: UserRole, search?: string) {
    isLoading.value = true
    error.value = null
    try {
      const params: Record<string, string> = {}
      if (role) params.role = role
      if (search?.trim()) params.search = search.trim()

      const res = await $fetch<{ data: UserWithUnit[] }>(
        '/api/admin/users',
        { params },
      )
      userList.value = res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar usuarios'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function createUser(data: CreateUserPayload) {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: UserWithUnit }>(
        '/api/admin/users',
        { method: 'POST', body: data },
      )
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear usuario'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function updateUser(userId: string, data: UpdateUserPayload) {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: UserWithUnit }>(
        `/api/admin/users/${userId}`,
        { method: 'PATCH', body: data },
      )
      await fetchUsers()
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar usuario'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function toggleBan(userId: string, banned: boolean, banReason?: string) {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: UserWithUnit }>(
        `/api/admin/users/${userId}/ban`,
        { method: 'POST', body: { banned, banReason } },
      )
      await fetchUsers()
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cambiar estado del usuario'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function resetPassword(userId: string, newPassword: string) {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch<{ success: boolean }>(
        `/api/admin/users/${userId}/password`,
        { method: 'POST', body: { newPassword } },
      )
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al resetear contraseña'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function deleteUser(userId: string) {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      await fetchUsers()
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar usuario'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    userList,
    isLoading,
    isSubmitting,
    error,
    fetchUsers,
    createUser,
    updateUser,
    toggleBan,
    resetPassword,
    deleteUser,
  }
}
