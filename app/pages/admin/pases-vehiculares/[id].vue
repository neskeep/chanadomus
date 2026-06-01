<script setup lang="ts">
import { Car, Download, Loader2, ScanLine, ShieldOff, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import QRCode from 'qrcode'
import type { VehiclePass } from '~~/shared/types/vehicle-pass'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const passId = route.params.id as string

const { deactivatePass, deletePass } = useVehiclePasses()
const { formatDate } = useFormatDate()
const { downloadBadge, isGenerating: isDownloadingBadge } = useQrBadge()

// Breadcrumb
const pageOverride = computed(() => ({
  title: 'Detalle de Pase',
  breadcrumbs: [{ label: 'Pases Vehiculares', to: '/admin/pases-vehiculares' }],
}))
usePageInfoOverride(pageOverride)

// State
const pass = ref<(VehiclePass & { issuedByName: string | null }) | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

// QR state
const qrDataUrl = ref<string | null>(null)

const passTypeLabel: Record<string, string> = {
  resident: 'Residente',
  guest: 'Invitado',
  temporary: 'Temporal',
}

const passTypeBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  resident: 'default',
  guest: 'secondary',
  temporary: 'outline',
}

async function fetchPass() {
  isLoading.value = true
  error.value = null
  try {
    const res = await $fetch<{ data: VehiclePass & { issuedByName: string | null } }>(`/api/vehicle-passes/${passId}`)
    pass.value = res.data
    await generateQrImage()
  }
  catch {
    error.value = 'Error al cargar pase vehicular'
  }
  finally {
    isLoading.value = false
  }
}

async function generateQrImage() {
  if (!pass.value?.token) {
    qrDataUrl.value = null
    return
  }
  const accessUrl = `${window.location.origin}/acceso/${pass.value.token}`
  qrDataUrl.value = await QRCode.toDataURL(accessUrl, { width: 250, margin: 2 })
}

// Deactivate
const isDeactivating = ref(false)
const confirmDeactivate = ref(false)

async function handleDeactivate() {
  if (!confirmDeactivate.value) {
    confirmDeactivate.value = true
    return
  }
  isDeactivating.value = true
  confirmDeactivate.value = false
  try {
    const ok = await deactivatePass(passId)
    if (ok) {
      toast.success('Pase desactivado')
      if (pass.value) {
        pass.value = { ...pass.value, isActive: false, deactivatedAt: new Date().toISOString() }
      }
    }
    else {
      toast.error('Error al desactivar pase')
    }
  }
  finally {
    isDeactivating.value = false
  }
}

// Delete
const isDeleting = ref(false)
const deleteDialogOpen = ref(false)

async function handleDelete() {
  isDeleting.value = true
  try {
    const ok = await deletePass(passId)
    if (ok) {
      toast.success('Pase eliminado')
      router.push('/admin/pases-vehiculares')
    }
    else {
      toast.error('Error al eliminar pase')
    }
  }
  finally {
    isDeleting.value = false
    deleteDialogOpen.value = false
  }
}

// Download badge
async function handleDownloadBadge(format: 'png' | 'svg' = 'png') {
  if (!pass.value) return
  const label = pass.value.vehiclePlate ?? pass.value.description ?? 'Pase'
  await downloadBadge({
    name: label,
    roleName: passTypeLabel[pass.value.passType] ?? pass.value.passType,
    unitNumber: pass.value.unitNumber,
    unitLabel: pass.value.unitLabel,
    qrToken: pass.value.token,
  }, format)
  toast.success(`Credencial descargada como ${format.toUpperCase()}`)
}

// Display label
const passTitle = computed(() => {
  if (!pass.value) return ''
  if (pass.value.vehiclePlate) return pass.value.vehiclePlate
  return pass.value.description ?? 'Pase vehicular'
})

onMounted(() => {
  fetchPass()
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Loader2 class="size-6 animate-spin text-muted-foreground" />
    </div>

    <!-- Error / Not found -->
    <div v-else-if="error || !pass" class="py-12 text-center">
      <p class="text-muted-foreground">{{ error ?? 'Pase no encontrado' }}</p>
      <Button variant="outline" class="mt-4" @click="router.push('/admin/pases-vehiculares')">
        Volver al listado
      </Button>
    </div>

    <!-- Content: 2 columns on desktop -->
    <div v-else class="grid gap-4 lg:grid-cols-3">
      <!-- Left column: Info (2/3) -->
      <div class="space-y-4 lg:col-span-2">
        <!-- Header card: Title + badges -->
        <Card>
          <CardContent class="p-5 md:p-6">
            <div class="flex items-start gap-4">
              <div class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Car class="size-6 text-primary" />
              </div>
              <div class="min-w-0 flex-1">
                <h2 class="truncate text-lg font-semibold" :class="pass.vehiclePlate ? 'font-mono tracking-wider' : ''">
                  {{ passTitle }}
                </h2>
                <div class="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge :variant="passTypeBadgeVariant[pass.passType] ?? 'default'" class="text-xs">
                    {{ passTypeLabel[pass.passType] ?? pass.passType }}
                  </Badge>
                  <Badge :variant="pass.isActive ? 'default' : 'destructive'" class="text-xs">
                    {{ pass.isActive ? 'Activo' : 'Inactivo' }}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Details card -->
        <Card>
          <CardContent class="p-5 md:p-8">
            <h3 class="mb-4 text-sm font-semibold">Información del pase</h3>
            <div class="space-y-4">
              <!-- Vehicle info (if present) -->
              <template v-if="pass.vehiclePlate">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p class="text-xs text-muted-foreground">Placa</p>
                    <p class="font-mono text-sm font-semibold tracking-wider">{{ pass.vehiclePlate }}</p>
                  </div>
                  <div v-if="pass.vehicleBrand || pass.vehicleModel">
                    <p class="text-xs text-muted-foreground">Vehículo</p>
                    <p class="text-sm">{{ [pass.vehicleBrand, pass.vehicleModel].filter(Boolean).join(' ') }}</p>
                  </div>
                </div>
                <div v-if="pass.vehicleColor" class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p class="text-xs text-muted-foreground">Color</p>
                    <p class="text-sm">{{ pass.vehicleColor }}</p>
                  </div>
                </div>
              </template>

              <!-- Description (temporary passes) -->
              <div v-if="pass.description">
                <p class="text-xs text-muted-foreground">Descripción</p>
                <p class="text-sm">{{ pass.description }}</p>
              </div>

              <Separator />

              <!-- Unit + Expiry + Occupants -->
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <p class="text-xs text-muted-foreground">Rancho asignado</p>
                  <p class="text-sm">
                    <template v-if="pass.unitLabel || pass.unitNumber">
                      {{ pass.unitLabel || pass.unitNumber }}
                    </template>
                    <span v-else class="text-muted-foreground">Condominio general</span>
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">Max. ocupantes</p>
                  <p class="text-sm">{{ pass.occupantLimit ?? 'Sin límite' }}</p>
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <p class="text-xs text-muted-foreground">Vencimiento</p>
                  <p class="text-sm">
                    <template v-if="pass.expiresAt">{{ formatDate(pass.expiresAt) }}</template>
                    <span v-else class="text-muted-foreground">Permanente</span>
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">Creado por</p>
                  <p class="text-sm">{{ pass.issuedByName ?? '—' }}</p>
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <p class="text-xs text-muted-foreground">Fecha de creación</p>
                  <p class="text-sm">{{ formatDate(pass.createdAt) }}</p>
                </div>
                <div v-if="pass.deactivatedAt">
                  <p class="text-xs text-muted-foreground">Fecha de desactivación</p>
                  <p class="text-sm">{{ formatDate(pass.deactivatedAt) }}</p>
                </div>
              </div>

              <!-- Notes -->
              <div v-if="pass.notes">
                <Separator class="mb-4" />
                <p class="text-xs text-muted-foreground">Notas</p>
                <p class="mt-1 text-sm whitespace-pre-wrap">{{ pass.notes }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Right column: QR section (1/3) -->
      <div class="space-y-4">
        <Card>
          <CardContent class="flex flex-col items-center p-5 md:p-6">
            <!-- Header -->
            <div class="mb-3 flex items-center gap-2">
              <ScanLine class="size-4 text-primary" />
              <h3 class="text-sm font-semibold">QR de Acceso</h3>
            </div>

            <!-- QR Image -->
            <img
              v-if="qrDataUrl"
              :src="qrDataUrl"
              alt="QR del pase vehicular"
              class="size-48 rounded-lg md:size-56"
            >
            <Skeleton v-else class="size-48 rounded-lg md:size-56" />

            <Separator class="my-3 w-full" />

            <!-- QR details -->
            <div class="w-full space-y-1.5 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Tipo</span>
                <Badge :variant="passTypeBadgeVariant[pass.passType] ?? 'default'" class="text-[11px]">
                  {{ passTypeLabel[pass.passType] ?? pass.passType }}
                </Badge>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Estado</span>
                <Badge :variant="pass.isActive ? 'default' : 'destructive'" class="text-[11px]">
                  {{ pass.isActive ? 'Activo' : 'Inactivo' }}
                </Badge>
              </div>
              <div v-if="pass.expiresAt" class="flex items-center justify-between">
                <span class="text-muted-foreground">Vence</span>
                <span class="text-xs">{{ formatDate(pass.expiresAt) }}</span>
              </div>
            </div>

            <Separator class="my-3 w-full" />

            <!-- Actions -->
            <div class="w-full space-y-2">
              <!-- Download badge -->
              <Button
                class="h-10 w-full text-sm"
                :disabled="isDownloadingBadge"
                @click="handleDownloadBadge('png')"
              >
                <Loader2 v-if="isDownloadingBadge" class="size-4 animate-spin" />
                <Download v-else class="size-4" />
                Descargar Credencial
              </Button>

              <!-- Deactivate / Status -->
              <template v-if="pass.isActive">
                <div v-if="confirmDeactivate" class="space-y-2">
                  <p class="text-center text-sm text-muted-foreground">
                    Esto desactivará el pase y dejará de funcionar
                  </p>
                  <div class="flex gap-2">
                    <Button
                      variant="outline"
                      class="h-10 flex-1 text-sm"
                      @click="confirmDeactivate = false"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      class="h-10 flex-1 text-sm"
                      :disabled="isDeactivating"
                      @click="handleDeactivate"
                    >
                      <Loader2 v-if="isDeactivating" class="size-4 animate-spin" />
                      <ShieldOff v-else class="size-4" />
                      Confirmar
                    </Button>
                  </div>
                </div>
                <Button
                  v-else
                  variant="outline"
                  class="h-10 w-full text-sm text-destructive hover:text-destructive"
                  :disabled="isDeactivating"
                  @click="handleDeactivate"
                >
                  <ShieldOff class="size-4" />
                  Desactivar Pase
                </Button>
              </template>

              <!-- Inactive state -->
              <div v-else class="flex items-center justify-center gap-2 rounded-lg bg-destructive/10 px-3 py-2">
                <ShieldOff class="size-4 text-destructive" />
                <span class="text-sm font-medium text-destructive">Pase desactivado</span>
              </div>

              <!-- Delete button (always visible) -->
              <Button
                variant="ghost"
                class="h-10 w-full text-sm text-destructive hover:text-destructive"
                :disabled="isDeleting"
                @click="deleteDialogOpen = true"
              >
                <Trash2 class="size-4" />
                Eliminar Pase
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Delete AlertDialog -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar pase vehicular</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. El pase será eliminado permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isDeleting"
            @click="handleDelete"
          >
            <Loader2 v-if="isDeleting" class="mr-1.5 size-4 animate-spin" />
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
