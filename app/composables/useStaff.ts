import type { Staff, StaffRole } from '~~/shared/types/staff'

interface CreateStaffData {
  name: string
  role: StaffRole
  idDocument?: string
  phone?: string
  email?: string
  shift?: string
}

type UpdateStaffData = Partial<CreateStaffData>

export function useStaff() {
  const staffList = ref<Staff[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function fetchStaff(role?: StaffRole) {
    isLoading.value = true
    error.value = null
    try {
      const query: Record<string, string> = {}
      if (role) query.role = role

      const res = await $fetch<{ data: Staff[] }>(
        '/api/staff',
        { params: query },
      )
      staffList.value = res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar personal'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function createStaffMember(data: CreateStaffData) {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Staff }>(
        '/api/staff',
        {
          method: 'POST',
          body: data,
        },
      )
      await fetchStaff()
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear personal'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function updateStaffMember(staffId: string, data: UpdateStaffData) {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Staff }>(
        `/api/staff/${staffId}`,
        {
          method: 'PATCH',
          body: data,
        },
      )
      await fetchStaff()
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar personal'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function deleteStaffMember(staffId: string) {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch(`/api/staff/${staffId}`, {
        method: 'DELETE',
      })
      await fetchStaff()
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar personal'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    staffList,
    isLoading,
    isSubmitting,
    error,
    fetchStaff,
    createStaffMember,
    updateStaffMember,
    deleteStaffMember,
  }
}
