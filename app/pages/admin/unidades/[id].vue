<script setup lang="ts">
import { Plus, Pencil, Trash2, Users, Car, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { HouseholdMember, HouseholdRelationship } from '~~/shared/types/household'
import type { Vehicle } from '~~/shared/types/vehicle'

definePageMeta({ layout: 'default' })

const { target, isMounted } = useTopbarPortal()
const route = useRoute()
const unitId = route.params.id as string

// Unit data
const unit = ref<{ id: string, number: string, label: string | null } | null>(null)
const unitLoading = ref(true)

async function fetchUnit() {
  unitLoading.value = true
  try {
    const res = await $fetch<{ data: { id: string, number: string, label: string | null }[] }>('/api/units')
    unit.value = res.data.find(u => u.id === unitId) ?? null
  }
  catch {
    toast.error('Error al cargar datos de la unidad')
  }
  finally {
    unitLoading.value = false
  }
}

// Members & Vehicles composables
const {
  members,
  isLoading: membersLoading,
  isSubmitting: membersSubmitting,
  fetchMembers,
  createMember,
  updateMember,
  deleteMember,
} = useUnitMembers(unitId)

const {
  vehicles,
  isLoading: vehiclesLoading,
  isSubmitting: vehiclesSubmitting,
  fetchVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = useUnitVehicles(unitId)

// Breadcrumb navigation
const pageOverride = computed(() => {
  if (unitLoading.value) return null
  if (!unit.value) return { title: 'Unidad no encontrada' }
  return {
    title: `Unidad ${unit.value.number}`,
    breadcrumbs: [{ label: 'Unidades', to: '/admin/unidades' }],
  }
})
usePageInfoOverride(pageOverride)

// Tabs
const activeTab = ref('members')

// Relationship config
const RELATIONSHIP_CONFIG: Record<HouseholdRelationship, { label: string, variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  owner: { label: 'Propietario', variant: 'default' },
  spouse: { label: 'Conyuge', variant: 'secondary' },
  child: { label: 'Hijo/a', variant: 'outline' },
  tenant: { label: 'Inquilino', variant: 'destructive' },
  other: { label: 'Otro', variant: 'outline' },
}

// ---- Member Dialog ----
const memberDialogOpen = ref(false)
const editingMember = ref<HouseholdMember | null>(null)
const memberForm = ref({
  name: '',
  relationship: 'owner' as HouseholdRelationship,
  idDocument: '',
  phone: '',
})

function openMemberDialog(member?: HouseholdMember) {
  if (member) {
    editingMember.value = member
    memberForm.value = {
      name: member.name,
      relationship: member.relationship,
      idDocument: member.idDocument ?? '',
      phone: member.phone ?? '',
    }
  }
  else {
    editingMember.value = null
    memberForm.value = { name: '', relationship: 'owner', idDocument: '', phone: '' }
  }
  memberDialogOpen.value = true
}

async function handleSaveMember() {
  const data = {
    name: memberForm.value.name.trim(),
    relationship: memberForm.value.relationship,
    idDocument: memberForm.value.idDocument.trim() || undefined,
    phone: memberForm.value.phone.trim() || undefined,
  }

  try {
    if (editingMember.value) {
      await updateMember(editingMember.value.id, data)
      toast.success('Miembro actualizado')
    }
    else {
      await createMember(data)
      toast.success('Miembro agregado')
    }
    memberDialogOpen.value = false
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

// ---- Vehicle Dialog ----
const vehicleDialogOpen = ref(false)
const editingVehicle = ref<Vehicle | null>(null)
const vehicleForm = ref({
  plate: '',
  brand: '',
  model: '',
  color: '',
  ownerMemberId: '',
})

function openVehicleDialog(vehicle?: Vehicle) {
  if (vehicle) {
    editingVehicle.value = vehicle
    vehicleForm.value = {
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      ownerMemberId: vehicle.ownerMemberId ?? 'none',
    }
  }
  else {
    editingVehicle.value = null
    vehicleForm.value = { plate: '', brand: '', model: '', color: '', ownerMemberId: 'none' }
  }
  vehicleDialogOpen.value = true
}

async function handleSaveVehicle() {
  const data = {
    plate: vehicleForm.value.plate.trim().toUpperCase(),
    brand: vehicleForm.value.brand.trim(),
    model: vehicleForm.value.model.trim(),
    color: vehicleForm.value.color.trim(),
    ownerMemberId: vehicleForm.value.ownerMemberId === 'none' ? undefined : vehicleForm.value.ownerMemberId || undefined,
  }

  try {
    if (editingVehicle.value) {
      await updateVehicle(editingVehicle.value.id, data)
      toast.success('Vehiculo actualizado')
    }
    else {
      await createVehicle(data)
      toast.success('Vehiculo registrado')
    }
    vehicleDialogOpen.value = false
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

// Helper: find member name by ID
function getMemberName(memberId: string | null): string {
  if (!memberId) return '—'
  const member = members.value.find(m => m.id === memberId)
  return member?.name ?? '—'
}

onMounted(() => {
  fetchUnit()
  fetchMembers()
  fetchVehicles()
})
</script>

<template>
  <div>
    <Teleport :to="target" defer v-if="isMounted">
      <Button v-if="activeTab === 'members'" size="sm" @click="openMemberDialog()">
        <Plus class="mr-1 size-4" />
        Agregar
      </Button>
      <Button v-else size="sm" @click="openVehicleDialog()">
        <Plus class="mr-1 size-4" />
        Agregar
      </Button>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button v-if="activeTab === 'members'" size="icon" variant="ghost" class="size-9" @click="openMemberDialog()">
        <Plus class="size-4" />
      </Button>
      <Button v-else size="icon" variant="ghost" class="size-9" @click="openVehicleDialog()">
        <Plus class="size-4" />
      </Button>
    </TopbarMobileAction>

    <!-- Unit header -->
    <div class="mb-6">
      <div v-if="unitLoading" class="space-y-2">
        <Skeleton class="h-7 w-32" />
        <Skeleton class="h-4 w-48" />
      </div>
      <div v-else-if="unit">
        <div class="flex items-center gap-3">
          <h1 class="text-xl font-semibold tracking-tight">{{ unit.number }}</h1>
          <Badge variant="secondary">Activa</Badge>
        </div>
        <p v-if="unit.label" class="mt-1 text-sm text-muted-foreground">{{ unit.label }}</p>
      </div>
      <div v-else>
        <h1 class="text-xl font-semibold tracking-tight text-destructive">Unidad no encontrada</h1>
      </div>
    </div>

    <!-- Tabs -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="w-full">
        <TabsTrigger value="members" class="flex-1">
          <Users class="mr-1.5 size-4" />
          Miembros
        </TabsTrigger>
        <TabsTrigger value="vehicles" class="flex-1">
          <Car class="mr-1.5 size-4" />
          Vehiculos
        </TabsTrigger>
      </TabsList>

      <!-- Members Tab -->
      <TabsContent value="members" class="mt-4">
        <p class="mb-4 text-sm text-muted-foreground">{{ members.length }} miembro{{ members.length !== 1 ? 's' : '' }}</p>

        <!-- Loading -->
        <ListSkeleton v-if="membersLoading" :count="3" variant="row" />

        <!-- Empty -->
        <EmptyState
          v-else-if="members.length === 0"
          :icon="Users"
          title="Sin miembros registrados"
          description="Agrega los miembros del hogar de esta unidad"
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
                    <Button variant="ghost" size="icon" class="size-10" @click="openMemberDialog(member)">
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
        <div v-if="!membersLoading && members.length > 0" class="space-y-2 md:hidden">
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
                  <Button variant="ghost" class="h-6 px-2 text-[11px]" @click="openMemberDialog(member)">
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
        <p class="mb-4 text-sm text-muted-foreground">{{ vehicles.length }} vehiculo{{ vehicles.length !== 1 ? 's' : '' }}</p>

        <!-- Loading -->
        <ListSkeleton v-if="vehiclesLoading" :count="3" variant="row" />

        <!-- Empty -->
        <EmptyState
          v-else-if="vehicles.length === 0"
          :icon="Car"
          title="Sin vehículos registrados"
          description="Agrega los vehículos asociados a esta unidad"
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
                    <Button variant="ghost" size="icon" class="size-10" @click="openVehicleDialog(vehicle)">
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
        <div v-if="!vehiclesLoading && vehicles.length > 0" class="space-y-2 md:hidden">
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
                  <Button variant="ghost" class="h-6 px-2 text-[11px]" @click="openVehicleDialog(vehicle)">
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
    </Tabs>

    <!-- Member Sheet -->
    <Sheet v-model:open="memberDialogOpen">
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{{ editingMember ? 'Editar miembro' : 'Agregar miembro' }}</SheetTitle>
          <SheetDescription>
            {{ editingMember ? 'Modifica los datos del miembro' : 'Registra un nuevo miembro del hogar' }}
          </SheetDescription>
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
            <Button type="button" variant="outline" class="h-12" @click="memberDialogOpen = false">
              Cancelar
            </Button>
            <Button type="submit" class="h-12" :disabled="!memberForm.name.trim() || membersSubmitting">
              <Loader2 v-if="membersSubmitting" class="mr-2 size-4 animate-spin" />
              {{ membersSubmitting ? 'Guardando...' : 'Guardar' }}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>

    <!-- Delete Member AlertDialog -->
    <AlertDialog v-model:open="deleteMemberDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar miembro</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminara a <span class="font-medium text-foreground">{{ memberToDelete?.name }}</span> de esta unidad. Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="membersSubmitting"
            @click="handleDeleteMember"
          >
            <Loader2 v-if="membersSubmitting" class="mr-2 size-4 animate-spin" />
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Vehicle Sheet -->
    <Sheet v-model:open="vehicleDialogOpen">
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{{ editingVehicle ? 'Editar vehiculo' : 'Agregar vehiculo' }}</SheetTitle>
          <SheetDescription>
            {{ editingVehicle ? 'Modifica los datos del vehiculo' : 'Registra un nuevo vehiculo' }}
          </SheetDescription>
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
            <Button type="button" variant="outline" class="h-12" @click="vehicleDialogOpen = false">
              Cancelar
            </Button>
            <Button
              type="submit"
              class="h-12"
              :disabled="!vehicleForm.plate.trim() || !vehicleForm.brand.trim() || !vehicleForm.model.trim() || !vehicleForm.color.trim() || vehiclesSubmitting"
            >
              <Loader2 v-if="vehiclesSubmitting" class="mr-2 size-4 animate-spin" />
              {{ vehiclesSubmitting ? 'Guardando...' : 'Guardar' }}
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
            :disabled="vehiclesSubmitting"
            @click="handleDeleteVehicle"
          >
            <Loader2 v-if="vehiclesSubmitting" class="mr-2 size-4 animate-spin" />
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
