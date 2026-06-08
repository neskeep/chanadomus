import type { Staff } from '~~/shared/types/staff'
import type { ServiceStaffRole } from '~~/shared/types/unit-service-staff'

interface CreateStaffData {
  name: string
  roleId: string
  idDocument?: string
  phone?: string
  email?: string
  shift?: string
  unitId?: string
}

interface UpdateStaffData {
  name?: string
  roleId?: string
  idDocument?: string
  phone?: string
  email?: string
  shift?: string
  unitId?: string | null
}

export function useStaff() {
  const staffList = ref<Staff[]>([])
  const roleOptions = ref<ServiceStaffRole[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function fetchRoles() {
    try {
      const res = await $fetch<{ data: ServiceStaffRole[] }>('/api/admin/service-roles', {
        params: { includeInactive: 'true', appliesTo: 'staff' },
      })
      roleOptions.value = res.data
    }
    catch { /* silent — dropdown will be empty */ }
  }

  async function fetchStaff(roleId?: string) {
    isLoading.value = true
    error.value = null
    try {
      const query: Record<string, string> = {}
      if (roleId) query.roleId = roleId

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

  async function uploadAvatar(staffId: string, file: File) {
    isSubmitting.value = true
    error.value = null
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await $fetch<{ data: { avatar: string } }>(
        `/api/staff/${staffId}/avatar`,
        {
          method: 'POST',
          body: formData,
        },
      )

      // Update local list if staff is present
      const member = staffList.value.find(s => s.id === staffId)
      if (member) {
        member.avatar = res.data.avatar
      }

      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al subir avatar'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function generateQr(staffId: string) {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: { qrToken: string } }>(
        `/api/staff/${staffId}/qr`,
        { method: 'POST' },
      )

      // Update local list if staff is present
      const member = staffList.value.find(s => s.id === staffId)
      if (member) {
        member.qrToken = res.data.qrToken
      }

      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al generar QR'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function getQrToken(staffId: string) {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: { qrToken: string | null } }>(
        `/api/staff/${staffId}/qr`,
      )
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener QR'
      error.value = message
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    staffList,
    roleOptions,
    isLoading,
    isSubmitting,
    error,
    fetchRoles,
    fetchStaff,
    createStaffMember,
    updateStaffMember,
    deleteStaffMember,
    uploadAvatar,
    generateQr,
    getQrToken,
  }
}
