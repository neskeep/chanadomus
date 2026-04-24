<script setup lang="ts">
import { ChevronLeft, Plus, Pencil, Trash2, Users, Car, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { HouseholdMember, HouseholdRelationship } from '~~/shared/types/household'
import type { Vehicle } from '~~/shared/types/vehicle'

definePageMeta({ layout: 'default' })

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
  <div class="mx-auto max-w-5xl">
    <!-- Header -->
    <div class="mb-6">
      <Button variant="ghost" size="sm" class="-ml-2 mb-2" as-child>
        <NuxtLink to="/admin/unidades">
          <ChevronLeft class="mr-1 size-4" />
          Unidades
        </NuxtLink>
      </Button>

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
        <!-- Action bar -->
        <div class="mb-4 flex items-center justify-between">
          <p class="text-sm text-muted-foreground">{{ members.length }} miembro{{ members.length !== 1 ? 's' : '' }}</p>
          <Button size="sm" @click="openMemberDialog()">
            <Plus class="mr-1 size-4" />
            Agregar
          </Button>
        </div>

        <!-- Loading -->
        <div v-if="membersLoading" class="space-y-2">
          <Skeleton v-for="i in 3" :key="i" class="h-14 w-full rounded-lg" />
        </div>

        <!-- Empty -->
        <div
          v-else-if="members.length === 0"
          class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"
        >
          <div class="flex size-12 items-center justify-center rounded-full bg-muted">
            <Users class="size-6 text-muted-foreground" />
          </div>
          <div>
            <p class="font-medium">Sin miembros registrados</p>
            <p class="mt-1 text-sm text-muted-foreground">Agrega los miembros del hogar de esta unidad</p>
          </div>
        </div>

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
                    <Button variant="ghost" size="icon" class="size-8" @click="openMemberDialog(member)">
                      <Pencil class="size-3.5" />
                      <span class="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" class="size-8 text-destructive hover:text-destructive" @click="confirmDeleteMember(member)">
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
        <div v-if="!membersLoading && members.length > 0" class="space-y-3 md:hidden">
          <Card v-for="member in members" :key="member.id">
            <CardContent class="p-4">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <p class="font-medium">{{ member.name }}</p>
                  <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge :variant="RELATIONSHIP_CONFIG[member.relationship].variant" class="text-xs">
                      {{ RELATIONSHIP_CONFIG[member.relationship].label }}
                    </Badge>
                  </div>
                  <div class="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    <p v-if="member.phone">Tel: {{ member.phone }}</p>
                    <p v-if="member.idDocument">Doc: {{ member.idDocument }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <Button variant="ghost" size="icon" class="size-8" @click="openMemberDialog(member)">
                    <Pencil class="size-3.5" />
                    <span class="sr-only">Editar</span>
                  </Button>
                  <Button variant="ghost" size="icon" class="size-8 text-destructive hover:text-destructive" @click="confirmDeleteMember(member)">
                    <Trash2 class="size-3.5" />
                    <span class="sr-only">Eliminar</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <!-- Vehicles Tab -->
      <TabsContent value="vehicles" class="mt-4">
        <!-- Action bar -->
        <div class="mb-4 flex items-center justify-between">
          <p class="text-sm text-muted-foreground">{{ vehicles.length }} vehiculo{{ vehicles.length !== 1 ? 's' : '' }}</p>
          <Button size="sm" @click="openVehicleDialog()">
            <Plus class="mr-1 size-4" />
            Agregar
          </Button>
        </div>

        <!-- Loading -->
        <div v-if="vehiclesLoading" class="space-y-2">
          <Skeleton v-for="i in 3" :key="i" class="h-14 w-full rounded-lg" />
        </div>

        <!-- Empty -->
        <div
          v-else-if="vehicles.length === 0"
          class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"
        >
          <div class="flex size-12 items-center justify-center rounded-full bg-muted">
            <Car class="size-6 text-muted-foreground" />
          </div>
          <div>
            <p class="font-medium">Sin vehiculos registrados</p>
            <p class="mt-1 text-sm text-muted-foreground">Agrega los vehiculos asociados a esta unidad</p>
          </div>
        </div>

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
                    <Button variant="ghost" size="icon" class="size-8" @click="openVehicleDialog(vehicle)">
                      <Pencil class="size-3.5" />
                      <span class="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" class="size-8 text-destructive hover:text-destructive" @click="confirmDeleteVehicle(vehicle)">
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
        <div v-if="!vehiclesLoading && vehicles.length > 0" class="space-y-3 md:hidden">
          <Card v-for="vehicle in vehicles" :key="vehicle.id">
            <CardContent class="p-4">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <p class="font-mono font-medium">{{ vehicle.plate }}</p>
                  <p class="mt-0.5 text-sm text-muted-foreground">{{ vehicle.brand }} {{ vehicle.model }}</p>
                  <div class="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    <p>Color: {{ vehicle.color }}</p>
                    <p>Propietario: {{ getMemberName(vehicle.ownerMemberId) }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <Button variant="ghost" size="icon" class="size-8" @click="openVehicleDialog(vehicle)">
                    <Pencil class="size-3.5" />
                    <span class="sr-only">Editar</span>
                  </Button>
                  <Button variant="ghost" size="icon" class="size-8 text-destructive hover:text-destructive" @click="confirmDeleteVehicle(vehicle)">
                    <Trash2 class="size-3.5" />
                    <span class="sr-only">Eliminar</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>

    <!-- Member Dialog -->
    <Dialog v-model:open="memberDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingMember ? 'Editar miembro' : 'Agregar miembro' }}</DialogTitle>
          <DialogDescription>
            {{ editingMember ? 'Modifica los datos del miembro' : 'Registra un nuevo miembro del hogar' }}
          </DialogDescription>
        </DialogHeader>

        <form class="space-y-4" @submit.prevent="handleSaveMember">
          <div class="space-y-2">
            <Label for="member-name">Nombre</Label>
            <Input
              id="member-name"
              v-model="memberForm.name"
              placeholder="Nombre completo"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="member-relationship">Parentesco</Label>
            <Select v-model="memberForm.relationship">
              <SelectTrigger id="member-relationship">
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
            />
          </div>

          <div class="space-y-2">
            <Label for="member-phone">Telefono</Label>
            <Input
              id="member-phone"
              v-model="memberForm.phone"
              placeholder="Opcional"
              type="tel"
            />
          </div>

          <DialogFooter class="gap-2 sm:gap-0">
            <Button type="button" variant="outline" @click="memberDialogOpen = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="!memberForm.name.trim() || membersSubmitting">
              <Loader2 v-if="membersSubmitting" class="mr-2 size-4 animate-spin" />
              {{ membersSubmitting ? 'Guardando...' : 'Guardar' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

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

    <!-- Vehicle Dialog -->
    <Dialog v-model:open="vehicleDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingVehicle ? 'Editar vehiculo' : 'Agregar vehiculo' }}</DialogTitle>
          <DialogDescription>
            {{ editingVehicle ? 'Modifica los datos del vehiculo' : 'Registra un nuevo vehiculo' }}
          </DialogDescription>
        </DialogHeader>

        <form class="space-y-4" @submit.prevent="handleSaveVehicle">
          <div class="space-y-2">
            <Label for="vehicle-plate">Placa</Label>
            <Input
              id="vehicle-plate"
              v-model="vehicleForm.plate"
              placeholder="Ej: ABC123"
              class="uppercase"
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
              />
            </div>
            <div class="space-y-2">
              <Label for="vehicle-model">Modelo</Label>
              <Input
                id="vehicle-model"
                v-model="vehicleForm.model"
                placeholder="Ej: Corolla"
                required
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
            />
          </div>

          <div class="space-y-2">
            <Label for="vehicle-owner">Propietario</Label>
            <Select v-model="vehicleForm.ownerMemberId">
              <SelectTrigger id="vehicle-owner">
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

          <DialogFooter class="gap-2 sm:gap-0">
            <Button type="button" variant="outline" @click="vehicleDialogOpen = false">
              Cancelar
            </Button>
            <Button
              type="submit"
              :disabled="!vehicleForm.plate.trim() || !vehicleForm.brand.trim() || !vehicleForm.model.trim() || !vehicleForm.color.trim() || vehiclesSubmitting"
            >
              <Loader2 v-if="vehiclesSubmitting" class="mr-2 size-4 animate-spin" />
              {{ vehiclesSubmitting ? 'Guardando...' : 'Guardar' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

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
