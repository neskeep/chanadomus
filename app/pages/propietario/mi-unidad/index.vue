<script setup lang="ts">
import { Plus, Pencil, Trash2, Users, Car, HardHat, Loader2, QrCode, Share2, Ban, ClipboardList, CheckCircle, XCircle, Clock } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import QRCode from 'qrcode'
import type { HouseholdMember, HouseholdRelationship } from '~~/shared/types/household'
import type { Vehicle } from '~~/shared/types/vehicle'
import type { UnitServiceStaff, StaffAttendanceLog } from '~~/shared/types/unit-service-staff'

definePageMeta({ layout: 'default' })
useHead({ title: 'Mi Unidad' })

const { target, isMounted } = useTopbarPortal()

const {
  members,
  vehicles,
  serviceStaff,
  serviceRoles,
  isLoading,
  isSubmitting,
  fetchAll,
  updateMember,
  deleteMember,
  updateVehicle,
  deleteVehicle,
  updateServiceStaff,
  deleteServiceStaff,
  generateStaffPass,
  revokeStaffPass,
  fetchStaffAttendance,
} = useMyUnit()

// Tabs synced with URL query param
const route = useRoute()
const VALID_TABS = ['members', 'vehicles', 'staff'] as const
type TabValue = typeof VALID_TABS[number]

function getInitialTab(): TabValue {
  const q = route.query.tab as string | undefined
  if (q && VALID_TABS.includes(q as TabValue)) return q as TabValue
  return 'members'
}

const activeTab = ref<TabValue>(getInitialTab())

const router = useRouter()
watch(activeTab, (tab) => {
  router.replace({ query: { ...route.query, tab } })
})

// Config maps
const RELATIONSHIP_CONFIG: Record<HouseholdRelationship, { label: string, variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  owner: { label: 'Propietario', variant: 'default' },
  spouse: { label: 'Conyuge', variant: 'secondary' },
  child: { label: 'Hijo/a', variant: 'outline' },
  tenant: { label: 'Inquilino', variant: 'destructive' },
  other: { label: 'Otro', variant: 'outline' },
}

// Helper: find member name by ID
function getMemberName(memberId: string | null): string {
  if (!memberId) return '—'
  const member = members.value.find(m => m.id === memberId)
  return member?.name ?? '—'
}

// Topbar add action based on active tab
const addRoutes: Record<string, string> = {
  members: '/propietario/mi-unidad/crear-miembro',
  vehicles: '/propietario/mi-unidad/crear-vehiculo',
  staff: '/propietario/mi-unidad/crear-personal',
}
function handleAddAction() {
  router.push(addRoutes[activeTab.value])
}

// ---- Member Sheet (edit only) ----
const memberSheetOpen = ref(false)
const editingMember = ref<HouseholdMember | null>(null)
const memberForm = ref({
  name: '',
  relationship: 'owner' as HouseholdRelationship,
  idDocument: '',
  phone: '',
})

function openMemberSheet(member: HouseholdMember) {
  editingMember.value = member
  memberForm.value = {
    name: member.name,
    relationship: member.relationship,
    idDocument: member.idDocument ?? '',
    phone: member.phone ?? '',
  }
  memberSheetOpen.value = true
}

async function handleSaveMember() {
  if (!editingMember.value) return
  const data = {
    name: memberForm.value.name.trim(),
    relationship: memberForm.value.relationship,
    idDocument: memberForm.value.idDocument.trim() || undefined,
    phone: memberForm.value.phone.trim() || undefined,
  }

  try {
    await updateMember(editingMember.value.id, data)
    toast.success('Miembro actualizado')
    memberSheetOpen.value = false
  }
  catch {
    toast.error('Error al guardar miembro')
  }
}

// ---- Delete Member ----
const deleteMemberDialogOpen = ref(false)
const memberToDelete = ref<HouseholdMember | null>(null)

function confirmDeleteMember(member: HouseholdMember) {
  memberToDelete.value = member
  deleteMemberDialogOpen.value = true
}

async function handleDeleteMember() {
  if (!memberToDelete.value) return
  try {
    await deleteMember(memberToDelete.value.id)
    toast.success('Miembro eliminado')
    deleteMemberDialogOpen.value = false
  }
  catch {
    toast.error('Error al eliminar miembro')
  }
}

// ---- Vehicle Sheet (edit only) ----
const vehicleSheetOpen = ref(false)
const editingVehicle = ref<Vehicle | null>(null)
const vehicleForm = ref({
  plate: '',
  brand: '',
  model: '',
  color: '',
  ownerMemberId: '',
})

function openVehicleSheet(vehicle: Vehicle) {
  editingVehicle.value = vehicle
  vehicleForm.value = {
    plate: vehicle.plate,
    brand: vehicle.brand,
    model: vehicle.model,
    color: vehicle.color,
    ownerMemberId: vehicle.ownerMemberId ?? 'none',
  }
  vehicleSheetOpen.value = true
}

async function handleSaveVehicle() {
  if (!editingVehicle.value) return
  const data = {
    plate: vehicleForm.value.plate.trim().toUpperCase(),
    brand: vehicleForm.value.brand.trim(),
    model: vehicleForm.value.model.trim(),
    color: vehicleForm.value.color.trim(),
    ownerMemberId: vehicleForm.value.ownerMemberId === 'none' ? undefined : vehicleForm.value.ownerMemberId || undefined,
  }

  try {
    await updateVehicle(editingVehicle.value.id, data)
    toast.success('Vehiculo actualizado')
    vehicleSheetOpen.value = false
  }
  catch {
    toast.error('Error al guardar vehiculo')
  }
}

// ---- Delete Vehicle ----
const deleteVehicleDialogOpen = ref(false)
const vehicleToDelete = ref<Vehicle | null>(null)

function confirmDeleteVehicle(vehicle: Vehicle) {
  vehicleToDelete.value = vehicle
  deleteVehicleDialogOpen.value = true
}

async function handleDeleteVehicle() {
  if (!vehicleToDelete.value) return
  try {
    await deleteVehicle(vehicleToDelete.value.id)
    toast.success('Vehiculo eliminado')
    deleteVehicleDialogOpen.value = false
  }
  catch {
    toast.error('Error al eliminar vehiculo')
  }
}

// ---- Service Staff Sheet (edit only) ----
const staffSheetOpen = ref(false)
const editingStaff = ref<UnitServiceStaff | null>(null)
const staffForm = ref({
  name: '',
  roleId: '',
  idDocument: '',
  phone: '',
})

function openStaffSheet(staff: UnitServiceStaff) {
  editingStaff.value = staff
  staffForm.value = {
    name: staff.name,
    roleId: staff.roleId,
    idDocument: staff.idDocument ?? '',
    phone: staff.phone ?? '',
  }
  staffSheetOpen.value = true
}

async function handleSaveStaff() {
  if (!editingStaff.value) return
  const data = {
    name: staffForm.value.name.trim(),
    roleId: staffForm.value.roleId,
    idDocument: staffForm.value.idDocument.trim() || undefined,
    phone: staffForm.value.phone.trim() || undefined,
  }

  try {
    await updateServiceStaff(editingStaff.value.id, data)
    toast.success('Personal actualizado')
    staffSheetOpen.value = false
  }
  catch {
    toast.error('Error al guardar personal')
  }
}

// ---- Delete Staff ----
const deleteStaffDialogOpen = ref(false)
const staffToDelete = ref<UnitServiceStaff | null>(null)

function confirmDeleteStaff(staff: UnitServiceStaff) {
  staffToDelete.value = staff
  deleteStaffDialogOpen.value = true
}

async function handleDeleteStaff() {
  if (!staffToDelete.value) return
  try {
    await deleteServiceStaff(staffToDelete.value.id)
    toast.success('Personal eliminado')
    deleteStaffDialogOpen.value = false
  }
  catch {
    toast.error('Error al eliminar personal')
  }
}

// ---- Staff QR Pass ----
const qrDialogOpen = ref(false)
const qrStaff = ref<UnitServiceStaff | null>(null)
const qrImageUrl = ref('')
const qrAccessUrl = ref('')
const isGeneratingQr = ref(false)

async function handleGeneratePass(staff: UnitServiceStaff) {
  qrStaff.value = staff
  isGeneratingQr.value = true
  qrDialogOpen.value = true

  try {
    const pass = await generateStaffPass(staff.id)
    const origin = window.location.origin
    qrAccessUrl.value = `${origin}/acceso/${pass.token}`
    qrImageUrl.value = await QRCode.toDataURL(qrAccessUrl.value, {
      width: 280,
      margin: 2,
      color: { dark: '#1F2933' },
    })
  }
  catch {
    toast.error('Error al generar pase QR')
    qrDialogOpen.value = false
  }
  finally {
    isGeneratingQr.value = false
  }
}

async function handleShowPass(staff: UnitServiceStaff) {
  if (!staff.passToken) return
  qrStaff.value = staff
  qrDialogOpen.value = true
  isGeneratingQr.value = true

  try {
    const origin = window.location.origin
    qrAccessUrl.value = `${origin}/acceso/${staff.passToken}`
    qrImageUrl.value = await QRCode.toDataURL(qrAccessUrl.value, {
      width: 280,
      margin: 2,
      color: { dark: '#1F2933' },
    })
  }
  catch {
    toast.error('Error al cargar QR')
    qrDialogOpen.value = false
  }
  finally {
    isGeneratingQr.value = false
  }
}

// ---- Revoke Staff Pass ----
const revokeDialogOpen = ref(false)
const staffToRevoke = ref<UnitServiceStaff | null>(null)

function confirmRevokePass(staff: UnitServiceStaff) {
  staffToRevoke.value = staff
  revokeDialogOpen.value = true
}

async function handleRevokePass() {
  if (!staffToRevoke.value) return
  try {
    await revokeStaffPass(staffToRevoke.value.id)
    toast.success('Pase revocado')
    revokeDialogOpen.value = false
    qrDialogOpen.value = false
  }
  catch {
    toast.error('Error al revocar pase')
  }
}

// ---- Staff Attendance ----
const attendanceDialogOpen = ref(false)
const attendanceStaff = ref<UnitServiceStaff | null>(null)
const attendanceLogs = ref<StaffAttendanceLog[]>([])
const isLoadingAttendance = ref(false)

async function openAttendanceDialog(staff: UnitServiceStaff) {
  attendanceStaff.value = staff
  attendanceDialogOpen.value = true
  isLoadingAttendance.value = true
  try {
    attendanceLogs.value = await fetchStaffAttendance(staff.id)
  }
  catch {
    toast.error('Error al cargar asistencia')
  }
  finally {
    isLoadingAttendance.value = false
  }
}

function formatAttendanceDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMs / 3600000)

  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `${diffMin}m`
  if (diffHrs < 24) return `${diffHrs}h`

  return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: diffHrs > 8760 ? 'numeric' : undefined })
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function handleSharePass() {
  if (!qrAccessUrl.value) return
  try {
    await navigator.share({
      title: `Pase de acceso — ${qrStaff.value?.name}`,
      url: qrAccessUrl.value,
    })
  }
  catch {
    await navigator.clipboard.writeText(qrAccessUrl.value)
    toast.success('Enlace copiado al portapapeles')
  }
}

onMounted(() => fetchAll())
</script>

<template>
  <div>
    <!-- Desktop topbar action -->
    <Teleport v-if="isMounted" :to="target" defer>
      <Button size="sm" @click="handleAddAction">
        <Plus class="mr-1 size-4" />
        Agregar
      </Button>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" @click="handleAddAction">
        <Plus class="size-4" />
      </Button>
    </TopbarMobileAction>

    <!-- Tabs -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="w-full">
        <TabsTrigger value="members" class="flex-1">
          <Users class="mr-1.5 size-4" />
          Integrantes
        </TabsTrigger>
        <TabsTrigger value="vehicles" class="flex-1">
          <Car class="mr-1.5 size-4" />
          Vehiculos
        </TabsTrigger>
        <TabsTrigger value="staff" class="flex-1">
          <HardHat class="mr-1.5 size-4" />
          Personal
        </TabsTrigger>
      </TabsList>

      <!-- Members Tab -->
      <TabsContent value="members" class="mt-4">
        <p class="mb-4 text-sm text-muted-foreground">
          {{ members.length }} integrante{{ members.length !== 1 ? 's' : '' }}
        </p>

        <ListSkeleton v-if="isLoading" :count="3" variant="row" />

        <EmptyState
          v-else-if="members.length === 0"
          :icon="Users"
          title="Sin integrantes"
          description="Agrega los miembros de tu hogar"
        />

        <!-- Desktop Table -->
        <div v-else class="hidden overflow-x-auto rounded-lg border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Parentesco</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead class="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="member in members" :key="member.id">
                <TableCell class="font-medium">{{ member.name }}</TableCell>
                <TableCell>
                  <Badge :variant="RELATIONSHIP_CONFIG[member.relationship].variant">
                    {{ RELATIONSHIP_CONFIG[member.relationship].label }}
                  </Badge>
                </TableCell>
                <TableCell class="text-muted-foreground">{{ member.phone ?? '—' }}</TableCell>
                <TableCell class="text-muted-foreground">{{ member.idDocument ?? '—' }}</TableCell>
                <TableCell>
                  <div class="flex items-center gap-1">
                    <Button variant="ghost" size="icon" class="size-10" @click="openMemberSheet(member)">
                      <Pencil class="size-3.5" />
                      <span class="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" class="size-10 text-destructive hover:text-destructive" @click="confirmDeleteMember(member)">
                      <Trash2 class="size-3.5" />
                      <span class="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Mobile Cards -->
        <div v-if="!isLoading && members.length > 0" class="space-y-2 md:hidden">
          <Card v-for="member in members" :key="member.id">
            <CardContent class="px-3 py-2.5">
              <div class="flex items-center gap-1.5">
                <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ member.name }}</p>
                <Badge :variant="RELATIONSHIP_CONFIG[member.relationship].variant" class="shrink-0 text-[11px]">
                  {{ RELATIONSHIP_CONFIG[member.relationship].label }}
                </Badge>
              </div>
              <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
                <template v-if="member.phone">
                  <span class="shrink-0 tabular-nums">{{ member.phone }}</span>
                </template>
                <template v-if="member.idDocument">
                  <span class="opacity-30">·</span>
                  <span class="truncate">{{ member.idDocument }}</span>
                </template>
                <span class="ml-auto flex shrink-0 items-center gap-0.5">
                  <Button variant="ghost" class="h-6 px-2 text-[11px]" @click="openMemberSheet(member)">
                    <Pencil class="size-3" />
                  </Button>
                  <Button variant="ghost" class="h-6 px-2 text-[11px] text-destructive hover:text-destructive" @click="confirmDeleteMember(member)">
                    <Trash2 class="size-3" />
                  </Button>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <!-- Vehicles Tab -->
      <TabsContent value="vehicles" class="mt-4">
        <p class="mb-4 text-sm text-muted-foreground">
          {{ vehicles.length }} vehiculo{{ vehicles.length !== 1 ? 's' : '' }}
        </p>

        <ListSkeleton v-if="isLoading" :count="3" variant="row" />

        <EmptyState
          v-else-if="vehicles.length === 0"
          :icon="Car"
          title="Sin vehiculos registrados"
          description="Agrega los vehiculos de tu hogar"
        />

        <!-- Desktop Table -->
        <div v-else class="hidden overflow-x-auto rounded-lg border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Marca / Modelo</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Propietario</TableHead>
                <TableHead class="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="vehicle in vehicles" :key="vehicle.id">
                <TableCell class="font-mono font-medium">{{ vehicle.plate }}</TableCell>
                <TableCell>{{ vehicle.brand }} {{ vehicle.model }}</TableCell>
                <TableCell>{{ vehicle.color }}</TableCell>
                <TableCell class="text-muted-foreground">{{ getMemberName(vehicle.ownerMemberId) }}</TableCell>
                <TableCell>
                  <div class="flex items-center gap-1">
                    <Button variant="ghost" size="icon" class="size-10" @click="openVehicleSheet(vehicle)">
                      <Pencil class="size-3.5" />
                      <span class="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" class="size-10 text-destructive hover:text-destructive" @click="confirmDeleteVehicle(vehicle)">
                      <Trash2 class="size-3.5" />
                      <span class="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Mobile Cards -->
        <div v-if="!isLoading && vehicles.length > 0" class="space-y-2 md:hidden">
          <Card v-for="vehicle in vehicles" :key="vehicle.id">
            <CardContent class="px-3 py-2.5">
              <div class="flex items-center gap-1.5">
                <p class="text-sm font-bold tabular-nums tracking-wider">{{ vehicle.plate }}</p>
                <span class="text-sm text-muted-foreground">{{ vehicle.brand }} {{ vehicle.model }}</span>
              </div>
              <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
                <span>{{ vehicle.color }}</span>
                <span class="opacity-30">·</span>
                <span class="truncate">{{ getMemberName(vehicle.ownerMemberId) }}</span>
                <span class="ml-auto flex shrink-0 items-center gap-0.5">
                  <Button variant="ghost" class="h-6 px-2 text-[11px]" @click="openVehicleSheet(vehicle)">
                    <Pencil class="size-3" />
                  </Button>
                  <Button variant="ghost" class="h-6 px-2 text-[11px] text-destructive hover:text-destructive" @click="confirmDeleteVehicle(vehicle)">
                    <Trash2 class="size-3" />
                  </Button>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <!-- Service Staff Tab -->
      <TabsContent value="staff" class="mt-4">
        <p class="mb-4 text-sm text-muted-foreground">
          {{ serviceStaff.length }} personal{{ serviceStaff.length !== 1 ? 'es' : '' }}
        </p>

        <ListSkeleton v-if="isLoading" :count="3" variant="row" />

        <EmptyState
          v-else-if="serviceStaff.length === 0"
          :icon="HardHat"
          title="Sin personal registrado"
          description="Agrega jardineros, domesticas u otro personal"
        />

        <!-- Desktop Table -->
        <div v-else class="hidden overflow-x-auto rounded-lg border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Pase QR</TableHead>
                <TableHead>Asistencia</TableHead>
                <TableHead class="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="staff in serviceStaff" :key="staff.id">
                <TableCell class="font-medium">{{ staff.name }}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {{ staff.roleName ?? 'Sin rol' }}
                  </Badge>
                </TableCell>
                <TableCell class="text-muted-foreground">{{ staff.phone ?? '—' }}</TableCell>
                <TableCell class="text-muted-foreground">{{ staff.idDocument ?? '—' }}</TableCell>
                <TableCell>
                  <Button
                    v-if="staff.hasPass"
                    variant="outline"
                    size="sm"
                    class="gap-1.5"
                    @click="handleShowPass(staff)"
                  >
                    <QrCode class="size-3.5" />
                    Ver QR
                  </Button>
                  <Button
                    v-else
                    variant="default"
                    size="sm"
                    class="gap-1.5"
                    @click="handleGeneratePass(staff)"
                  >
                    <QrCode class="size-3.5" />
                    Generar
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    class="gap-1.5"
                    @click="openAttendanceDialog(staff)"
                  >
                    <ClipboardList class="size-3.5" />
                    Ver historial
                  </Button>
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-1">
                    <Button variant="ghost" size="icon" class="size-10" @click="openStaffSheet(staff)">
                      <Pencil class="size-3.5" />
                      <span class="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" class="size-10 text-destructive hover:text-destructive" @click="confirmDeleteStaff(staff)">
                      <Trash2 class="size-3.5" />
                      <span class="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Mobile Cards -->
        <div v-if="!isLoading && serviceStaff.length > 0" class="space-y-2 md:hidden">
          <Card v-for="staff in serviceStaff" :key="staff.id">
            <CardContent class="px-3 py-2.5">
              <div class="flex items-center gap-1.5">
                <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ staff.name }}</p>
                <Badge variant="secondary" class="shrink-0 text-[11px]">
                  {{ staff.roleName ?? 'Sin rol' }}
                </Badge>
              </div>
              <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
                <template v-if="staff.phone">
                  <span class="shrink-0 tabular-nums">{{ staff.phone }}</span>
                </template>
                <template v-if="staff.idDocument">
                  <span class="opacity-30">·</span>
                  <span class="truncate">{{ staff.idDocument }}</span>
                </template>
                <span class="ml-auto flex shrink-0 items-center gap-0.5">
                  <Button
                    v-if="staff.hasPass"
                    variant="ghost"
                    class="h-6 px-2 text-[11px] text-primary"
                    @click="handleShowPass(staff)"
                  >
                    <QrCode class="size-3" />
                  </Button>
                  <Button
                    v-else
                    variant="ghost"
                    class="h-6 px-2 text-[11px]"
                    @click="handleGeneratePass(staff)"
                  >
                    <QrCode class="size-3" />
                  </Button>
                  <Button variant="ghost" class="h-6 px-2 text-[11px]" @click="openAttendanceDialog(staff)">
                    <ClipboardList class="size-3" />
                  </Button>
                  <Button variant="ghost" class="h-6 px-2 text-[11px]" @click="openStaffSheet(staff)">
                    <Pencil class="size-3" />
                  </Button>
                  <Button variant="ghost" class="h-6 px-2 text-[11px] text-destructive hover:text-destructive" @click="confirmDeleteStaff(staff)">
                    <Trash2 class="size-3" />
                  </Button>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>

    <!-- Member Sheet -->
    <Sheet v-model:open="memberSheetOpen">
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Editar integrante</SheetTitle>
          <SheetDescription>Modifica los datos del integrante</SheetDescription>
        </SheetHeader>

        <form class="space-y-4" @submit.prevent="handleSaveMember">
          <div class="space-y-2">
            <Label for="member-name">Nombre</Label>
            <Input
              id="member-name"
              v-model="memberForm.name"
              placeholder="Nombre completo"
              required
              class="h-12"
            />
          </div>

          <div class="space-y-2">
            <Label for="member-relationship">Parentesco</Label>
            <Select v-model="memberForm.relationship">
              <SelectTrigger id="member-relationship" size="lg">
                <SelectValue placeholder="Seleccionar parentesco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Propietario</SelectItem>
                <SelectItem value="spouse">Conyuge</SelectItem>
                <SelectItem value="child">Hijo/a</SelectItem>
                <SelectItem value="tenant">Inquilino</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="member-id-document">Documento de identidad</Label>
            <Input
              id="member-id-document"
              v-model="memberForm.idDocument"
              placeholder="Opcional"
              class="h-12"
            />
          </div>

          <div class="space-y-2">
            <Label for="member-phone">Telefono</Label>
            <Input
              id="member-phone"
              v-model="memberForm.phone"
              placeholder="Opcional"
              type="tel"
              class="h-12"
            />
          </div>

          <SheetFooter class="gap-2 sm:gap-0">
            <Button type="button" variant="outline" class="h-12" @click="memberSheetOpen = false">
              Cancelar
            </Button>
            <Button type="submit" class="h-12" :disabled="!memberForm.name.trim() || isSubmitting">
              <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
              {{ isSubmitting ? 'Guardando...' : 'Guardar' }}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>

    <!-- Delete Member AlertDialog -->
    <AlertDialog v-model:open="deleteMemberDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar integrante</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminara a <span class="font-medium text-foreground">{{ memberToDelete?.name }}</span> de tu unidad. Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isSubmitting"
            @click="handleDeleteMember"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Vehicle Sheet -->
    <Sheet v-model:open="vehicleSheetOpen">
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Editar vehículo</SheetTitle>
          <SheetDescription>Modifica los datos del vehículo</SheetDescription>
        </SheetHeader>

        <form class="space-y-4" @submit.prevent="handleSaveVehicle">
          <div class="space-y-2">
            <Label for="vehicle-plate">Placa</Label>
            <Input
              id="vehicle-plate"
              v-model="vehicleForm.plate"
              placeholder="Ej: ABC123"
              class="h-12 uppercase"
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <Label for="vehicle-brand">Marca</Label>
              <Input
                id="vehicle-brand"
                v-model="vehicleForm.brand"
                placeholder="Ej: Toyota"
                required
                class="h-12"
              />
            </div>
            <div class="space-y-2">
              <Label for="vehicle-model">Modelo</Label>
              <Input
                id="vehicle-model"
                v-model="vehicleForm.model"
                placeholder="Ej: Corolla"
                required
                class="h-12"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="vehicle-color">Color</Label>
            <Input
              id="vehicle-color"
              v-model="vehicleForm.color"
              placeholder="Ej: Blanco"
              required
              class="h-12"
            />
          </div>

          <div class="space-y-2">
            <Label for="vehicle-owner">Propietario</Label>
            <Select v-model="vehicleForm.ownerMemberId">
              <SelectTrigger id="vehicle-owner" size="lg">
                <SelectValue placeholder="Seleccionar miembro (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                <SelectItem v-for="member in members" :key="member.id" :value="member.id">
                  {{ member.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SheetFooter class="gap-2 sm:gap-0">
            <Button type="button" variant="outline" class="h-12" @click="vehicleSheetOpen = false">
              Cancelar
            </Button>
            <Button
              type="submit"
              class="h-12"
              :disabled="!vehicleForm.plate.trim() || !vehicleForm.brand.trim() || !vehicleForm.model.trim() || !vehicleForm.color.trim() || isSubmitting"
            >
              <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
              {{ isSubmitting ? 'Guardando...' : 'Guardar' }}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>

    <!-- Delete Vehicle AlertDialog -->
    <AlertDialog v-model:open="deleteVehicleDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar vehiculo</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminara el vehiculo con placa <span class="font-mono font-medium text-foreground">{{ vehicleToDelete?.plate }}</span>. Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isSubmitting"
            @click="handleDeleteVehicle"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Service Staff Sheet -->
    <Sheet v-model:open="staffSheetOpen">
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Editar personal</SheetTitle>
          <SheetDescription>Modifica los datos del personal de servicio</SheetDescription>
        </SheetHeader>

        <form class="space-y-4" @submit.prevent="handleSaveStaff">
          <div class="space-y-2">
            <Label for="staff-name">Nombre</Label>
            <Input
              id="staff-name"
              v-model="staffForm.name"
              placeholder="Nombre completo"
              required
              class="h-12"
            />
          </div>

          <div class="space-y-2">
            <Label for="staff-role">Rol</Label>
            <Select v-model="staffForm.roleId">
              <SelectTrigger id="staff-role" size="lg">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="role in serviceRoles" :key="role.id" :value="role.id">
                  {{ role.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="staff-id-document">Documento de identidad</Label>
            <Input
              id="staff-id-document"
              v-model="staffForm.idDocument"
              placeholder="Opcional"
              class="h-12"
            />
          </div>

          <div class="space-y-2">
            <Label for="staff-phone">Telefono</Label>
            <Input
              id="staff-phone"
              v-model="staffForm.phone"
              placeholder="Opcional"
              type="tel"
              class="h-12"
            />
          </div>

          <SheetFooter class="gap-2 sm:gap-0">
            <Button type="button" variant="outline" class="h-12" @click="staffSheetOpen = false">
              Cancelar
            </Button>
            <Button type="submit" class="h-12" :disabled="!staffForm.name.trim() || isSubmitting">
              <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
              {{ isSubmitting ? 'Guardando...' : 'Guardar' }}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>

    <!-- Delete Staff AlertDialog -->
    <AlertDialog v-model:open="deleteStaffDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar personal</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminara a <span class="font-medium text-foreground">{{ staffToDelete?.name }}</span> del registro. Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isSubmitting"
            @click="handleDeleteStaff"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- QR Pass Dialog -->
    <Dialog v-model:open="qrDialogOpen">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Pase QR — {{ qrStaff?.name }}</DialogTitle>
          <DialogDescription>
            {{ qrStaff?.roleName ?? 'Personal de servicio' }} — pase de acceso multi-uso
          </DialogDescription>
        </DialogHeader>

        <div class="flex flex-col items-center gap-4 py-4">
          <div v-if="isGeneratingQr" class="flex size-[280px] items-center justify-center">
            <Loader2 class="size-8 animate-spin text-muted-foreground" />
          </div>
          <img
            v-else-if="qrImageUrl"
            :src="qrImageUrl"
            :alt="`QR de acceso para ${qrStaff?.name}`"
            class="size-[280px] rounded-lg"
          />

          <p class="text-center text-[11px] text-muted-foreground">
            Este pase permite acceso recurrente. El vigilante lo escanea cada vez que ingresa.
          </p>
        </div>

        <div class="flex gap-2">
          <Button class="flex-1 gap-1.5" @click="handleSharePass">
            <Share2 class="size-4" />
            Compartir
          </Button>
          <Button
            variant="outline"
            class="gap-1.5 text-destructive hover:text-destructive"
            @click="confirmRevokePass(qrStaff!)"
          >
            <Ban class="size-4" />
            Revocar
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Revoke Pass AlertDialog -->
    <AlertDialog v-model:open="revokeDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revocar pase de acceso</AlertDialogTitle>
          <AlertDialogDescription>
            Se revocara el pase QR de <span class="font-medium text-foreground">{{ staffToRevoke?.name }}</span>. Ya no podra ingresar con este codigo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isSubmitting"
            @click="handleRevokePass"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            Revocar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Attendance Dialog -->
    <Dialog v-model:open="attendanceDialogOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Asistencia — {{ attendanceStaff?.name }}</DialogTitle>
          <DialogDescription>
            {{ attendanceStaff?.roleName ?? 'Personal de servicio' }} — ultimos 50 registros
          </DialogDescription>
        </DialogHeader>

        <div class="max-h-[60vh] overflow-y-auto">
          <div v-if="isLoadingAttendance" class="flex items-center justify-center py-8">
            <Loader2 class="size-6 animate-spin text-muted-foreground" />
          </div>

          <div v-else-if="attendanceLogs.length === 0" class="py-8 text-center">
            <ClipboardList class="mx-auto mb-2 size-8 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">Sin registros de asistencia</p>
            <p class="mt-1 text-[11px] text-muted-foreground/70">Los registros aparecen cuando vigilancia escanea el pase QR</p>
          </div>

          <div v-else class="relative space-y-0 pl-5">
            <!-- Timeline line -->
            <div class="absolute bottom-0 left-[5px] top-0 w-px bg-border" />

            <div
              v-for="log in attendanceLogs"
              :key="log.id"
              class="relative py-2"
            >
              <!-- Timeline dot -->
              <div
                class="absolute -left-5 top-3.5 size-2.5 rounded-lg ring-2 ring-background"
                :class="log.result === 'allowed' ? 'bg-primary' : 'bg-destructive'"
              />

              <div class="flex items-center gap-1.5">
                <CheckCircle v-if="log.result === 'allowed'" class="size-3.5 shrink-0 text-primary" />
                <XCircle v-else class="size-3.5 shrink-0 text-destructive" />
                <span class="text-sm font-medium">
                  {{ log.result === 'allowed' ? 'Entrada permitida' : log.result === 'expired' ? 'Pase expirado' : 'Acceso denegado' }}
                </span>
                <span class="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {{ formatAttendanceDate(log.createdAt) }}
                </span>
              </div>
              <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
                <span class="tabular-nums">{{ formatFullDate(log.createdAt) }}</span>
                <template v-if="log.exitAt">
                  <span class="opacity-30">·</span>
                  <Clock class="size-3" />
                  <span class="tabular-nums">Salida {{ formatFullDate(log.exitAt) }}</span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
