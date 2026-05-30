import type { HouseholdMember, HouseholdRelationship, HouseholdMemberPass } from '~~/shared/types/household'
import type { Vehicle } from '~~/shared/types/vehicle'
import type { VehiclePass } from '~~/shared/types/vehicle-pass'
import type { UnitServiceStaff, ServiceStaffRole, ServiceStaffPass, StaffAttendanceLog } from '~~/shared/types/unit-service-staff'

// --- Member types ---
interface CreateMemberData {
  name: string
  relationship: HouseholdRelationship
  idDocument?: string
  phone?: string
}
type UpdateMemberData = Partial<CreateMemberData>

// --- Vehicle types ---
interface CreateVehicleData {
  plate: string
  brand: string
  model: string
  color: string
  ownerMemberId?: string
}
type UpdateVehicleData = Partial<CreateVehicleData>

// --- Service Staff types ---
interface CreateServiceStaffData {
  name: string
  roleId: string
  idDocument?: string
  phone?: string
}
type UpdateServiceStaffData = Partial<CreateServiceStaffData>

export function useMyUnit() {
  // --- State ---
  const members = ref<HouseholdMember[]>([])
  const serviceRoles = ref<ServiceStaffRole[]>([])
  const vehicles = ref<Vehicle[]>([])
  const serviceStaff = ref<UnitServiceStaff[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  // --- Members ---
  async function fetchMembers() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: HouseholdMember[] }>('/api/my-unit/members')
      members.value = res.data
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al cargar miembros'
    }
    finally {
      isLoading.value = false
    }
  }

  async function createMember(data: CreateMemberData) {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: HouseholdMember }>('/api/my-unit/members', {
        method: 'POST',
        body: data,
      })
      await fetchMembers()
      return res.data
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al crear miembro'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function updateMember(id: string, data: UpdateMemberData) {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: HouseholdMember }>(`/api/my-unit/members/${id}`, {
        method: 'PATCH',
        body: data,
      })
      await fetchMembers()
      return res.data
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar miembro'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function deleteMember(id: string) {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch(`/api/my-unit/members/${id}`, { method: 'DELETE' })
      await fetchMembers()
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar miembro'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  // --- Vehicles ---
  async function fetchVehicles() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Vehicle[] }>('/api/my-unit/vehicles')
      vehicles.value = res.data
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al cargar vehículos'
    }
    finally {
      isLoading.value = false
    }
  }

  async function createVehicle(data: CreateVehicleData) {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Vehicle }>('/api/my-unit/vehicles', {
        method: 'POST',
        body: data,
      })
      await fetchVehicles()
      return res.data
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al registrar vehículo'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function updateVehicle(id: string, data: UpdateVehicleData) {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Vehicle }>(`/api/my-unit/vehicles/${id}`, {
        method: 'PATCH',
        body: data,
      })
      await fetchVehicles()
      return res.data
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar vehículo'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function deleteVehicle(id: string) {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch(`/api/my-unit/vehicles/${id}`, { method: 'DELETE' })
      await fetchVehicles()
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar vehículo'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  // --- Service Staff ---
  async function fetchServiceStaff() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: UnitServiceStaff[] }>('/api/my-unit/service-staff')
      serviceStaff.value = res.data
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al cargar personal de servicio'
    }
    finally {
      isLoading.value = false
    }
  }

  async function createServiceStaff(data: CreateServiceStaffData) {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: UnitServiceStaff }>('/api/my-unit/service-staff', {
        method: 'POST',
        body: data,
      })
      await fetchServiceStaff()
      return res.data
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al registrar personal'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function updateServiceStaff(id: string, data: UpdateServiceStaffData) {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: UnitServiceStaff }>(`/api/my-unit/service-staff/${id}`, {
        method: 'PATCH',
        body: data,
      })
      await fetchServiceStaff()
      return res.data
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar personal'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function deleteServiceStaff(id: string) {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch(`/api/my-unit/service-staff/${id}`, { method: 'DELETE' })
      await fetchServiceStaff()
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar personal'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  // --- Service Roles (read-only catalog) ---
  async function fetchServiceRoles() {
    try {
      const res = await $fetch<{ data: ServiceStaffRole[] }>('/api/my-unit/service-roles')
      serviceRoles.value = res.data
    }
    catch {
      // Silent — roles are supplementary
    }
  }

  // --- Member Passes ---
  async function generateMemberPass(memberId: string): Promise<HouseholdMemberPass> {
    isSubmitting.value = true
    try {
      const res = await $fetch<{ data: HouseholdMemberPass }>(`/api/my-unit/members/${memberId}/pass`, {
        method: 'POST',
      })
      await fetchMembers()
      return res.data
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al generar pase'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function revokeMemberPass(memberId: string): Promise<void> {
    isSubmitting.value = true
    try {
      await $fetch(`/api/my-unit/members/${memberId}/pass`, { method: 'DELETE' })
      await fetchMembers()
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al revocar pase'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  // --- Vehicle Passes ---
  async function generateVehiclePass(vehicleId: string): Promise<VehiclePass> {
    isSubmitting.value = true
    try {
      const res = await $fetch<{ data: VehiclePass }>(`/api/my-unit/vehicles/${vehicleId}/pass`, {
        method: 'POST',
      })
      await fetchVehicles()
      return res.data
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al generar pase'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function revokeVehiclePass(vehicleId: string): Promise<void> {
    isSubmitting.value = true
    try {
      await $fetch(`/api/my-unit/vehicles/${vehicleId}/pass`, { method: 'DELETE' })
      await fetchVehicles()
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al revocar pase'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  // --- Service Staff Passes ---
  async function generateStaffPass(staffId: string): Promise<ServiceStaffPass> {
    isSubmitting.value = true
    try {
      const res = await $fetch<{ data: ServiceStaffPass }>(`/api/my-unit/service-staff/${staffId}/pass`, {
        method: 'POST',
      })
      await fetchServiceStaff()
      return res.data
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al generar pase'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function getStaffPass(staffId: string): Promise<ServiceStaffPass | null> {
    try {
      const res = await $fetch<{ data: ServiceStaffPass | null }>(`/api/my-unit/service-staff/${staffId}/pass`)
      return res.data
    }
    catch {
      return null
    }
  }

  async function fetchStaffAttendance(staffId: string): Promise<StaffAttendanceLog[]> {
    try {
      const res = await $fetch<{ data: StaffAttendanceLog[] }>(`/api/my-unit/service-staff/${staffId}/attendance`)
      return res.data
    }
    catch {
      return []
    }
  }

  async function revokeStaffPass(staffId: string): Promise<void> {
    isSubmitting.value = true
    try {
      await $fetch(`/api/my-unit/service-staff/${staffId}/pass`, { method: 'DELETE' })
      await fetchServiceStaff()
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al revocar pase'
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  // --- Fetch all ---
  async function fetchAll() {
    isLoading.value = true
    error.value = null
    try {
      await Promise.all([
        fetchMembers(),
        fetchVehicles(),
        fetchServiceStaff(),
        fetchServiceRoles(),
      ])
    }
    catch {
      // Individual fetches handle their own errors
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    // State
    members,
    vehicles,
    serviceStaff,
    serviceRoles,
    isLoading,
    isSubmitting,
    error,
    // Members
    fetchMembers,
    createMember,
    updateMember,
    deleteMember,
    // Vehicles
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    // Service Staff
    fetchServiceStaff,
    fetchServiceRoles,
    createServiceStaff,
    updateServiceStaff,
    deleteServiceStaff,
    // Member Passes
    generateMemberPass,
    revokeMemberPass,
    // Vehicle Passes
    generateVehiclePass,
    revokeVehiclePass,
    // Staff Passes
    generateStaffPass,
    getStaffPass,
    revokeStaffPass,
    fetchStaffAttendance,
    // All
    fetchAll,
  }
}
