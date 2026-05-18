<script setup lang="ts">
import { Plus, Pencil, Trash2, Users, Car, HardHat, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { HouseholdMember, HouseholdRelationship } from '~~/shared/types/household'
import type { Vehicle } from '~~/shared/types/vehicle'
import type { UnitServiceStaff } from '~~/shared/types/unit-service-staff'

definePageMeta({ layout: 'default' })
useHead({ title: 'Mi Unidad' })

const { target, isMounted } = useTopbarPortal()

const {
  members,
  vehicles,
  serviceStaff,
  isLoading,
  isSubmitting,
  fetchAll,
  deleteMember,
  deleteVehicle,
  deleteServiceStaff,
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

// ---- Navigation to edit pages ----
function navigateToEditMember(member: HouseholdMember) {
  router.push(`/propietario/mi-unidad/editar-miembro/${member.id}`)
}

function navigateToEditVehicle(vehicle: Vehicle) {
  router.push(`/propietario/mi-unidad/editar-vehiculo/${vehicle.id}`)
}

function navigateToEditStaff(staff: UnitServiceStaff) {
  router.push(`/propietario/mi-unidad/editar-personal/${staff.id}`)
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
                    <Button variant="ghost" size="icon" class="size-10" @click="navigateToEditMember(member)">
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
                  <Button variant="ghost" class="h-6 px-2 text-[11px]" @click="navigateToEditMember(member)">
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
                    <Button variant="ghost" size="icon" class="size-10" @click="navigateToEditVehicle(vehicle)">
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
                  <Button variant="ghost" class="h-6 px-2 text-[11px]" @click="navigateToEditVehicle(vehicle)">
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
                  <div class="flex items-center gap-1">
                    <Button variant="ghost" size="icon" class="size-10" @click="navigateToEditStaff(staff)">
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
                  <Button variant="ghost" class="h-6 px-2 text-[11px]" @click="navigateToEditStaff(staff)">
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
  </div>
</template>
