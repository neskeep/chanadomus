<script setup lang="ts">
import { Plus, Pencil, Trash2, Users, Phone, Clock, Loader2, QrCode, Share2, Ban, Home, Download } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import QRCode from 'qrcode'
import type { Staff } from '~~/shared/types/staff'

useHead({ title: 'Personal' })

const { staffList, isLoading, isSubmitting, error, fetchStaff, deleteStaffMember, generateQr, roleOptions: roles, fetchRoles } = useStaff()
const { downloadBadge, isGenerating: isDownloadingBadge } = useQrBadge()

const { target, isMounted } = useTopbarPortal()

// Filters
const selectedRole = ref('')
const searchQuery = ref('')

const filterRoleOptions = computed(() =>
  roles.value.map(r => ({ value: r.id, label: r.name })),
)

// Delete dialog
const deleteDialogOpen = ref(false)
const staffToDelete = ref<Staff | null>(null)

function getShiftLabel(shift: string | null): string {
  if (!shift) return '—'
  const labels: Record<string, string> = { mañana: 'Mañana', tarde: 'Tarde', noche: 'Noche' }
  return labels[shift] ?? shift
}

const filteredStaff = computed(() => {
  if (!searchQuery.value.trim()) return staffList.value
  const q = searchQuery.value.trim().toLowerCase()
  return staffList.value.filter(s =>
    s.name.toLowerCase().includes(q)
    || s.phone?.toLowerCase().includes(q)
    || s.email?.toLowerCase().includes(q),
  )
})

function navigateToEdit(staff: Staff) {
  navigateTo(`/admin/personal/${staff.id}`)
}

function openDeleteDialog(staff: Staff) {
  staffToDelete.value = staff
  deleteDialogOpen.value = true
}

async function handleDelete() {
  if (!staffToDelete.value) return

  try {
    await deleteStaffMember(staffToDelete.value.id)
    toast.success('Personal desactivado correctamente')
    deleteDialogOpen.value = false
  }
  catch {
    toast.error(error.value ?? 'Error al desactivar')
  }
}

// QR dialog
const qrDialogOpen = ref(false)
const qrStaff = ref<Staff | null>(null)
const qrImageUrl = ref('')
const qrAccessUrl = ref('')
const isGeneratingQr = ref(false)

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

async function handleGenerateQr(member: Staff) {
  qrStaff.value = member
  isGeneratingQr.value = true
  qrDialogOpen.value = true

  try {
    const result = await generateQr(member.id)
    const origin = window.location.origin
    qrAccessUrl.value = `${origin}/acceso/${result.qrToken}`
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

async function handleShowQr(member: Staff) {
  if (!member.qrToken) return
  qrStaff.value = member
  qrDialogOpen.value = true
  isGeneratingQr.value = true

  try {
    const origin = window.location.origin
    qrAccessUrl.value = `${origin}/acceso/${member.qrToken}`
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

async function handleDownloadBadge() {
  if (!qrStaff.value?.qrToken) return
  await downloadBadge({
    name: qrStaff.value.name,
    roleName: qrStaff.value.roleName ?? null,
    unitNumber: qrStaff.value.unitNumber ?? null,
    unitLabel: qrStaff.value.unitLabel ?? null,
    phone: qrStaff.value.phone ?? null,
    qrToken: qrStaff.value.qrToken,
  })
  toast.success('Credencial descargada')
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

watch(selectedRole, (role) => {
  fetchStaff(role || undefined)
})

onMounted(() => {
  fetchStaff()
  fetchRoles()
})
</script>

<template>
  <div>
    <Teleport :to="target" defer v-if="isMounted">
      <TopbarSearch v-model="searchQuery" placeholder="Buscar personal...">
        <TopbarFilters :active="selectedRole !== ''" @clear="selectedRole = ''">
          <TopbarFilterGroup v-model="selectedRole" label="Rol" :options="filterRoleOptions" />
        </TopbarFilters>
      </TopbarSearch>
      <NuxtLink to="/admin/personal/crear">
        <Button size="sm">
          <Plus class="mr-1.5 size-3.5" />
          Nuevo
        </Button>
      </NuxtLink>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" as-child>
        <NuxtLink to="/admin/personal/crear">
          <Plus class="size-4" />
        </NuxtLink>
      </Button>
    </TopbarMobileAction>

    <!-- Mobile search -->
    <div class="mb-4 md:hidden">
      <TopbarSearch v-model="searchQuery" placeholder="Buscar personal...">
        <TopbarFilters :active="selectedRole !== ''" @clear="selectedRole = ''">
          <TopbarFilterGroup v-model="selectedRole" label="Rol" :options="filterRoleOptions" />
        </TopbarFilters>
      </TopbarSearch>
    </div>

    <!-- Error -->
    <ErrorAlert v-if="error && !isSubmitting" :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="4" variant="row" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="filteredStaff.length === 0"
      :icon="Users"
      title="No hay personal registrado"
      :description="selectedRole ? 'Prueba cambiando el filtro de rol' : 'Agrega miembros del personal del condominio'"
    />

    <!-- Table (desktop) / Cards (mobile) -->
    <div v-else>
      <!-- Desktop table -->
      <div class="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Pase QR</TableHead>
              <TableHead class="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="member in filteredStaff" :key="member.id">
              <TableCell>
                <div class="flex items-center gap-2">
                  <Avatar class="size-7 shrink-0">
                    <AvatarImage v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                    <AvatarFallback class="bg-primary/10 text-[10px] font-semibold text-primary">
                      {{ getInitials(member.name) }}
                    </AvatarFallback>
                  </Avatar>
                  <span class="font-medium">{{ member.name }}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {{ member.roleName ?? 'Sin rol' }}
                </Badge>
              </TableCell>
              <TableCell class="text-muted-foreground">{{ member.phone ?? '—' }}</TableCell>
              <TableCell class="text-muted-foreground">
                {{ member.unitLabel || member.unitNumber || '—' }}
              </TableCell>
              <TableCell class="text-muted-foreground">{{ getShiftLabel(member.shift) }}</TableCell>
              <TableCell>
                <Button
                  v-if="member.qrToken"
                  variant="outline"
                  size="sm"
                  class="gap-1.5"
                  @click="handleShowQr(member)"
                >
                  <QrCode class="size-3.5" />
                  Ver QR
                </Button>
                <Button
                  v-else
                  variant="default"
                  size="sm"
                  class="gap-1.5"
                  @click="handleGenerateQr(member)"
                >
                  <QrCode class="size-3.5" />
                  Generar
                </Button>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1">
                  <Button variant="ghost" size="icon" class="size-10" @click="navigateToEdit(member)">
                    <Pencil class="size-3.5" />
                    <span class="sr-only">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-10 text-destructive hover:text-destructive"
                    @click="openDeleteDialog(member)"
                  >
                    <Trash2 class="size-3.5" />
                    <span class="sr-only">Desactivar</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile cards -->
      <div class="space-y-2 md:hidden">
        <Card v-for="member in filteredStaff" :key="member.id">
          <CardContent class="px-3 py-2.5">
            <!-- Row 1: Avatar + Name + Role badge -->
            <div class="flex items-center gap-2">
              <Avatar class="size-7 shrink-0">
                <AvatarImage v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                <AvatarFallback class="bg-primary/10 text-[10px] font-semibold text-primary">
                  {{ getInitials(member.name) }}
                </AvatarFallback>
              </Avatar>
              <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ member.name }}</p>
              <Badge variant="secondary" class="shrink-0 text-[11px]">
                {{ member.roleName ?? 'Sin rol' }}
              </Badge>
            </div>
            <!-- Row 2: Phone · Shift | QR + Actions inline -->
            <div class="mt-0.5 flex items-center gap-x-1 pl-9 text-[11px] text-muted-foreground">
              <template v-if="member.phone">
                <Phone class="size-3 shrink-0" />
                <span class="shrink-0 tabular-nums">{{ member.phone }}</span>
              </template>
              <template v-if="member.unitNumber">
                <span class="opacity-30">·</span>
                <Home class="size-3 shrink-0" />
                <span>{{ member.unitLabel || member.unitNumber }}</span>
              </template>
              <template v-if="member.shift">
                <span class="opacity-30">·</span>
                <Clock class="size-3 shrink-0" />
                <span>{{ getShiftLabel(member.shift) }}</span>
              </template>
              <span class="ml-auto flex shrink-0 items-center gap-0.5">
                <Button
                  v-if="member.qrToken"
                  variant="ghost"
                  class="h-6 px-2 text-[11px] text-primary"
                  @click="handleShowQr(member)"
                >
                  <QrCode class="size-3" />
                </Button>
                <Button
                  v-else
                  variant="ghost"
                  class="h-6 px-2 text-[11px]"
                  @click="handleGenerateQr(member)"
                >
                  <QrCode class="size-3" />
                </Button>
                <Button variant="ghost" class="h-6 px-2 text-[11px]" @click="navigateToEdit(member)">
                  <Pencil class="size-3" />
                </Button>
                <Button variant="ghost" class="h-6 px-2 text-[11px] text-destructive hover:text-destructive" @click="openDeleteDialog(member)">
                  <Trash2 class="size-3" />
                </Button>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Delete AlertDialog -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Desactivar personal</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de desactivar a {{ staffToDelete?.name }}? Esta acción se puede revertir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isSubmitting"
            @click="handleDelete"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            Desactivar
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
            {{ qrStaff?.roleName ?? 'Sin rol' }} — pase de acceso multi-uso
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
            class="gap-1.5"
            @click="handleGenerateQr(qrStaff!)"
          >
            <QrCode class="size-4" />
            Regenerar
          </Button>
        </div>
        <Button
          class="w-full gap-1.5"
          :disabled="isDownloadingBadge"
          @click="handleDownloadBadge"
        >
          <Loader2 v-if="isDownloadingBadge" class="size-4 animate-spin" />
          <Download v-else class="size-4" />
          Descargar Credencial
        </Button>
      </DialogContent>
    </Dialog>
  </div>
</template>
