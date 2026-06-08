interface UserProfile {
  id: string
  name: string
  email: string
  phone: string | null
  cedula: string | null
  image: string | null
  role: string | null
  unitId: string | null
  unitNumber: string | null
  unitLabel: string | null
  createdAt: string
}

export function useProfile() {
  const profile = ref<UserProfile | null>(null)
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function fetchProfile() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: UserProfile }>('/api/me/profile')
      profile.value = res.data
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al cargar perfil'
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateProfile(data: { name?: string; phone?: string | null; cedula?: string | null }) {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch('/api/me/profile', { method: 'PATCH', body: data })
      await fetchProfile()
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar perfil'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function uploadAvatar(file: File) {
    isSubmitting.value = true
    error.value = null
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await $fetch<{ data: { image: string } }>('/api/me/avatar', {
        method: 'POST',
        body: formData,
      })
      if (profile.value) {
        profile.value.image = res.data.image
      }
      return res.data.image
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al subir avatar'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function changePassword(data: { currentPassword: string; newPassword: string }) {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch('/api/me/password', { method: 'POST', body: data })
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al cambiar contraseña'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    profile,
    isLoading,
    isSubmitting,
    error,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
  }
}
