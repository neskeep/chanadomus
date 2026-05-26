<script setup lang="ts">
import { Plus, Pencil, Trash2, Users, Car, Loader2, Mail, Link, Copy, Ban } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { HouseholdMember, HouseholdRelationship } from '~~/shared/types/household'
import type { Vehicle } from '~~/shared/types/vehicle'
import type { Invitation, InvitationStatus } from '~~/shared/types/invitation'

const router = useRouter()

definePageMeta({ layout: 'default' })

const { target, isMounted } = useTopbarPortal()
const route = useRoute()
const unitId = route.params.id as string
const { formatDateTime } = useFormatDate()

// Unit data
const unit = ref<{ id: string, number: string, label: string | null, isActive: boolean } | null>(null)
const unitLoading = ref(true)

async function fetchUnit() {
  unitLoading.value = true
  try {
    const res = await $fetch<{ data: { id: string, number: string, label: string | null, isActive: boolean }[] }>('/api/units')
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
  deleteMember,
} = useUnitMembers(unitId)

const {
  vehicles,
  isLoading: vehiclesLoading,
  isSubmitting: vehiclesSubmitting,
  fetchVehicles,
  deleteVehicle,
} = useUnitVehicles(unitId)

// Invitations composable
const {
  invitations: unitInvitations,
  pendingInvitations,
  isLoading: invitationsLoading,
  isSubmitting: invitationsSubmitting,
  fetchInvitations,
  createInvitation,
  revokeInvitation,
} = useInvitations(unitId)

const usedOrExpiredInvitations = computed(() =>
  unitInvitations.value.filter(i => i.status !== 'pending'),
)

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

// ---- Member Navigation ----
function navigateToAddMember() {
  router.push(`/admin/unidades/${unitId}/miembros/nuevo`)
}

function navigateToEditMember(member: HouseholdMember) {
  router.push(`/admin/unidades/${unitId}/miembros/${member.id}`)
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

// ---- Vehicle Navigation ----
function navigateToAddVehicle() {
  router.push(`/admin/unidades/${unitId}/vehiculos/nuevo`)
}

function navigateToEditVehicle(vehicleId: string) {
  router.push(`/admin/unidades/${unitId}/vehiculos/${vehicleId}`)
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

// ---- Invitation Create Dialog ----
const createInvitationDialogOpen = ref(false)
const newInvitationRole = ref<'propietario' | 'conserje'>('propietario')
const generatedInvitationUrl = ref<string | null>(null)

function openCreateInvitationDialog() {
  newInvitationRole.value = 'propietario'
  generatedInvitationUrl.value = null
  createInvitationDialogOpen.value = true
}

async function handleCreateInvitation() {
  try {
    const result = await createInvitation(newInvitationRole.value)
    if (result) {
      generatedInvitationUrl.value = `${window.location.origin}/invitacion/${result.token}`
      toast.success('Invitacion creada')
    }
  }
  catch {
    toast.error('Error al crear invitacion')
  }
}

function copyInvitationUrl(url: string) {
  navigator.clipboard.writeText(url)
  toast.success('Enlace copiado')
}

function getInvitationUrl(token: string): string {
  return `${window.location.origin}/invitacion/${token}`
}

// ---- Revoke Invitation ----
const revokeDialogOpen = ref(false)
const invitationToRevoke = ref<Invitation | null>(null)

function confirmRevokeInvitation(invitation: Invitation) {
  invitationToRevoke.value = invitation
  revokeDialogOpen.value = true
}

async function handleRevokeInvitation() {
  if (!invitationToRevoke.value) return
  try {
    await revokeInvitation(invitationToRevoke.value.id)
    toast.success('Invitacion revocada')
    revokeDialogOpen.value = false
  }
  catch {
    toast.error('Error al revocar invitacion')
  }
}

// ---- Invitation Status Config ----
const INVITATION_STATUS_CONFIG: Record<InvitationStatus, { label: string, variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Pendiente', variant: 'default' },
  used: { label: 'Usada', variant: 'secondary' },
  expired: { label: 'Expirada', variant: 'outline' },
  revoked: { label: 'Revocada', variant: 'destructive' },
}

const ROLE_LABELS: Record<string, string> = {
  propietario: 'Propietario',
  conserje: 'Conserje',
}

onMounted(() => {
  fetchUnit()
  fetchMembers()
  fetchVehicles()
  fetchInvitations()
})
</script>

<template>
  <div>
    <Teleport :to="target" defer v-if="isMounted">
      <Button v-if="activeTab === 'members'" size="sm" @click="navigateToAddMember()">
        <Plus class="mr-1 size-4" />
        Agregar
      </Button>
      <Button v-else-if="activeTab === 'vehicles'" size="sm" @click="navigateToAddVehicle()">
        <Plus class="mr-1 size-4" />
        Agregar
      </Button>
      <Button v-else-if="activeTab === 'invitations'" size="sm" @click="openCreateInvitationDialog()">
        <Link class="mr-1 size-4" />
        Generar enlace
      </Button>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button v-if="activeTab === 'members'" size="icon" variant="ghost" class="size-9" @click="navigateToAddMember()">
        <Plus class="size-4" />
      </Button>
      <Button v-else-if="activeTab === 'vehicles'" size="icon" variant="ghost" class="size-9" @click="navigateToAddVehicle()">
        <Plus class="size-4" />
      </Button>
      <Button v-else-if="activeTab === 'invitations'" size="icon" variant="ghost" class="size-9" @click="openCreateInvitationDialog()">
        <Link class="size-4" />
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
          <Badge :variant="unit.isActive ? 'secondary' : 'outline'">{{ unit.isActive ? 'Activa' : 'Inactiva' }}</Badge>
          <Button variant="ghost" size="icon" class="size-8" @click="router.push(`/admin/unidades/${unitId}/editar`)">
            <Pencil class="size-3.5" />
            <span class="sr-only">Editar unidad</span>
          </Button>
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
        <TabsTrigger value="invitations" class="flex-1">
          <Mail class="mr-1.5 size-4" />
          Invitaciones
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
                    <Button variant="ghost" size="icon" class="size-10" @click="navigateToEditVehicle(vehicle.id)">
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
                  <Button variant="ghost" class="h-6 px-2 text-[11px]" @click="navigateToEditVehicle(vehicle.id)">
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

      <!-- Invitations Tab -->
      <TabsContent value="invitations" class="mt-4">
        <!-- Loading -->
        <ListSkeleton v-if="invitationsLoading" :count="3" variant="row" />

        <template v-else>
          <!-- Pending Invitations -->
          <div v-if="pendingInvitations.length > 0" class="mb-6">
            <p class="mb-3 text-sm font-medium">Invitaciones pendientes ({{ pendingInvitations.length }})</p>

            <!-- Desktop Table -->
            <div class="hidden overflow-x-auto rounded-lg border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rol</TableHead>
                    <TableHead>Expira</TableHead>
                    <TableHead>Creada</TableHead>
                    <TableHead class="w-32">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="invitation in pendingInvitations" :key="invitation.id">
                    <TableCell>
                      <Badge variant="default">{{ ROLE_LABELS[invitation.role] }}</Badge>
                    </TableCell>
                    <TableCell class="text-muted-foreground">{{ formatDateTime(invitation.expiresAt) }}</TableCell>
                    <TableCell class="text-muted-foreground">{{ formatDateTime(invitation.createdAt) }}</TableCell>
                    <TableCell>
                      <div class="flex items-center gap-1">
                        <Button variant="ghost" size="icon" class="size-10" @click="copyInvitationUrl(getInvitationUrl(invitation.token))">
                          <Copy class="size-3.5" />
                          <span class="sr-only">Copiar enlace</span>
                        </Button>
                        <Button variant="ghost" size="icon" class="size-10 text-destructive hover:text-destructive" @click="confirmRevokeInvitation(invitation)">
                          <Ban class="size-3.5" />
                          <span class="sr-only">Revocar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <!-- Mobile Cards -->
            <div class="space-y-2 md:hidden">
              <Card v-for="invitation in pendingInvitations" :key="invitation.id">
                <CardContent class="px-3 py-2.5">
                  <div class="flex items-center gap-1.5">
                    <Badge variant="default" class="shrink-0 text-[11px]">{{ ROLE_LABELS[invitation.role] }}</Badge>
                    <Badge variant="outline" class="shrink-0 text-[11px]">{{ INVITATION_STATUS_CONFIG[invitation.status].label }}</Badge>
                  </div>
                  <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
                    <span class="truncate">Expira: {{ formatDateTime(invitation.expiresAt) }}</span>
                    <span class="ml-auto flex shrink-0 items-center gap-0.5">
                      <Button variant="ghost" class="h-6 px-2 text-[11px]" @click="copyInvitationUrl(getInvitationUrl(invitation.token))">
                        <Copy class="size-3" />
                      </Button>
                      <Button variant="ghost" class="h-6 px-2 text-[11px] text-destructive hover:text-destructive" @click="confirmRevokeInvitation(invitation)">
                        <Ban class="size-3" />
                      </Button>
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <!-- Empty state (no invitations at all) -->
          <EmptyState
            v-if="unitInvitations.length === 0"
            :icon="Mail"
            title="Sin invitaciones"
            description="Genera un enlace de invitacion para que un usuario se registre en esta unidad"
          />

          <!-- History (used/expired/revoked) -->
          <div v-if="usedOrExpiredInvitations.length > 0">
            <Separator v-if="pendingInvitations.length > 0" class="mb-4" />
            <p class="mb-3 text-sm font-medium text-muted-foreground">Historial ({{ usedOrExpiredInvitations.length }})</p>

            <!-- Desktop Table -->
            <div class="hidden overflow-x-auto rounded-lg border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creada</TableHead>
                    <TableHead>Finalizada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="invitation in usedOrExpiredInvitations" :key="invitation.id">
                    <TableCell>
                      <Badge variant="secondary">{{ ROLE_LABELS[invitation.role] }}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge :variant="INVITATION_STATUS_CONFIG[invitation.status].variant">
                        {{ INVITATION_STATUS_CONFIG[invitation.status].label }}
                      </Badge>
                    </TableCell>
                    <TableCell class="text-muted-foreground">{{ formatDateTime(invitation.createdAt) }}</TableCell>
                    <TableCell class="text-muted-foreground">
                      {{ invitation.usedAt ? formatDateTime(invitation.usedAt) : invitation.revokedAt ? formatDateTime(invitation.revokedAt) : formatDateTime(invitation.expiresAt) }}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <!-- Mobile Cards -->
            <div class="space-y-2 md:hidden">
              <Card v-for="invitation in usedOrExpiredInvitations" :key="invitation.id">
                <CardContent class="px-3 py-2.5">
                  <div class="flex items-center gap-1.5">
                    <Badge variant="secondary" class="shrink-0 text-[11px]">{{ ROLE_LABELS[invitation.role] }}</Badge>
                    <Badge :variant="INVITATION_STATUS_CONFIG[invitation.status].variant" class="shrink-0 text-[11px]">
                      {{ INVITATION_STATUS_CONFIG[invitation.status].label }}
                    </Badge>
                  </div>
                  <div class="mt-0.5 text-[11px] text-muted-foreground">
                    {{ formatDateTime(invitation.createdAt) }}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </template>
      </TabsContent>
    </Tabs>

    <!-- Create Invitation Dialog -->
    <Dialog v-model:open="createInvitationDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generar enlace de invitacion</DialogTitle>
          <DialogDescription>
            Crea un enlace para que un usuario se registre y se asocie a esta unidad.
          </DialogDescription>
        </DialogHeader>

        <!-- Before generation: role selection -->
        <div v-if="!generatedInvitationUrl" class="space-y-4 py-2">
          <div class="space-y-2">
            <Label for="invitation-role">Rol del invitado</Label>
            <Select v-model="newInvitationRole">
              <SelectTrigger id="invitation-role">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="propietario">Propietario</SelectItem>
                <SelectItem value="conserje">Conserje</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- After generation: show link -->
        <div v-else class="space-y-3 py-2">
          <Label>Enlace de invitacion</Label>
          <div class="flex items-center gap-2">
            <Input :model-value="generatedInvitationUrl" readonly class="font-mono text-xs" />
            <Button variant="outline" size="icon" class="shrink-0" @click="copyInvitationUrl(generatedInvitationUrl!)">
              <Copy class="size-4" />
              <span class="sr-only">Copiar enlace</span>
            </Button>
          </div>
          <p class="text-xs text-muted-foreground">Este enlace expira en 7 dias. Compartelo con el usuario que deseas invitar.</p>
        </div>

        <DialogFooter>
          <Button v-if="!generatedInvitationUrl" @click="handleCreateInvitation" :disabled="invitationsSubmitting">
            <Loader2 v-if="invitationsSubmitting" class="mr-2 size-4 animate-spin" />
            Generar enlace
          </Button>
          <Button v-else variant="outline" @click="createInvitationDialogOpen = false">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Revoke Invitation AlertDialog -->
    <AlertDialog v-model:open="revokeDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revocar invitacion</AlertDialogTitle>
          <AlertDialogDescription>
            Se revocara la invitacion de <span class="font-medium text-foreground">{{ ROLE_LABELS[invitationToRevoke?.role ?? 'propietario'] }}</span>. El enlace dejara de funcionar. Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="invitationsSubmitting"
            @click="handleRevokeInvitation"
          >
            <Loader2 v-if="invitationsSubmitting" class="mr-2 size-4 animate-spin" />
            Revocar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

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
