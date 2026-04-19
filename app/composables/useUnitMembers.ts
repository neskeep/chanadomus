import type { HouseholdMember, HouseholdRelationship } from '~~/shared/types/household'

interface CreateMemberData {
  name: string
  relationship: HouseholdRelationship
  idDocument?: string
  phone?: string
}

type UpdateMemberData = Partial<CreateMemberData>

export function useUnitMembers(unitId: Ref<string> | string) {
  const members = ref<HouseholdMember[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function fetchMembers() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: HouseholdMember[] }>(
        `/api/units/${unref(unitId)}/members`,
      )
      members.value = res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar miembros'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function createMember(data: CreateMemberData) {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: HouseholdMember }>(
        `/api/units/${unref(unitId)}/members`,
        {
          method: 'POST',
          body: data,
        },
      )
      await fetchMembers()
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear miembro'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function updateMember(memberId: string, data: UpdateMemberData) {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: HouseholdMember }>(
        `/api/members/${memberId}`,
        {
          method: 'PATCH',
          body: data,
        },
      )
      await fetchMembers()
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar miembro'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function deleteMember(memberId: string) {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch(`/api/members/${memberId}`, {
        method: 'DELETE',
      })
      await fetchMembers()
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar miembro'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    members,
    isLoading,
    isSubmitting,
    error,
    fetchMembers,
    createMember,
    updateMember,
    deleteMember,
  }
}
