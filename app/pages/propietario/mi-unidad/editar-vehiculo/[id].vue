<script setup lang="ts">
import { Download, Loader2, QrCode, Share2, Ban, Trash2, Shield } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import QRCode from 'qrcode'
import type { Vehicle } from '~~/shared/types/vehicle'

useHead({ title: 'Editar Vehiculo' })

const route = useRoute()
const router = useRouter()
const vehicleId = route.params.id as string

const {
  members,
  vehicles,
  isSubmitting,
  error,
  updateVehicle,
  fetchMembers,
  fetchVehicles,
  generateVehiclePass,
  revokeVehiclePass,
  deleteVehicle,
} = useMyUnit()

const currentVehicle = ref<Vehicle | null>(null)
const qrImageUrl = ref('')
const qrAccessUrl = ref('')
const isGeneratingQr = ref(false)

const formPlate = ref('')
const formBrand = ref('')
const formModel = ref('')
const formColor = ref('')
const formOwnerMemberId = ref('none')

const { downloadBadge, isGenerating: isDownloadingBadge } = useQrBadge()

const isLoadingData = ref(true)

const canSubmit = computed(() =>
  formPlate.value.trim().length > 0
  && formBrand.value.trim().length > 0
  && formModel.value.trim().length > 0
  && formColor.value.trim().length > 0
  && !isSubmitting.value,
)

async function generateQrImage(token: string) {
  const origin = window.location.origin
  qrAccessUrl.value = `${origin}/acceso/${token}`
  qrImageUrl.value = await QRCode.toDataURL(qrAccessUrl.value, {
    width: 280,
    margin: 2,
    color: { dark: '#1F2933' },
  })
}

async function loadVehicle() {
  isLoadingData.value = true
  try {
    await Promise.all([fetchVehicles(), fetchMembers()])
    const vehicle = vehicles.value.find(v => v.id === vehicleId)
    if (!vehicle) {
      toast.error('Vehiculo no encontrado')
      router.replace('/propietario/mi-unidad?tab=vehicles')
      return
    }
    currentVehicle.value = vehicle
    formPlate.value = vehicle.plate
    formBrand.value = vehicle.brand
    formModel.value = vehicle.model
    formColor.value = vehicle.color
    formOwnerMemberId.value = vehicle.ownerMemberId ?? 'none'
    if (vehicle.hasPass && vehicle.passToken) {
      await generateQrImage(vehicle.passToken)
    }
  }
  catch {
    toast.error('Error al cargar vehiculo')
  }
  finally {
    isLoadingData.value = false
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    await updateVehicle(vehicleId, {
      plate: formPlate.value.trim().toUpperCase(),
      brand: formBrand.value.trim(),
      model: formModel.value.trim(),
      color: formColor.value.trim(),
      ownerMemberId: formOwnerMemberId.value === 'none' ? undefined : formOwnerMemberId.value || undefined,
    })
    toast.success('Vehiculo actualizado correctamente')
    router.push('/propietario/mi-unidad?tab=vehicles')
  }
  catch {
    toast.error(error.value ?? 'Error al guardar')
  }
}

async function handleGeneratePass() {
  isGeneratingQr.value = true
  try {
    const pass = await generateVehiclePass(vehicleId)
    await generateQrImage(pass.token)
    await fetchVehicles()
    currentVehicle.value = vehicles.value.find(v => v.id === vehicleId) ?? null
    toast.success('Pase QR generado')
  }
  catch {
    toast.error('Error al generar pase QR')
  }
  finally {
    isGeneratingQr.value = false
  }
}

async function handleRevokePass() {
  try {
    await revokeVehiclePass(vehicleId)
    qrImageUrl.value = ''
    qrAccessUrl.value = ''
    await fetchVehicles()
    currentVehicle.value = vehicles.value.find(v => v.id === vehicleId) ?? null
    toast.success('Pase revocado')
  }
  catch {
    toast.error('Error al revocar pase')
  }
}

async function handleSharePass() {
  if (!qrAccessUrl.value) return
  try {
    if (navigator.share) {
      await navigator.share({
        title: `Pase de acceso — ${formPlate.value}`,
        url: qrAccessUrl.value,
      })
    }
    else {
      await navigator.clipboard.writeText(qrAccessUrl.value)
      toast.success('Enlace copiado al portapapeles')
    }
  }
  catch (err: unknown) {
    if (err instanceof Error && err.name !== 'AbortError') {
      await navigator.clipboard.writeText(qrAccessUrl.value)
      toast.success('Enlace copiado al portapapeles')
    }
  }
}

async function handleDownloadBadge() {
  if (!currentVehicle.value?.passToken) return
  await downloadBadge({
    name: formPlate.value,
    roleName: `${formBrand.value} ${formModel.value}`,
    unitNumber: formColor.value || null,
    qrToken: currentVehicle.value.passToken,
  })
  toast.success('Credencial descargada')
}

async function handleDelete() {
  try {
    await deleteVehicle(vehicleId)
    toast.success('Vehiculo eliminado')
    router.push('/propietario/mi-unidad?tab=vehicles')
  }
  catch {
    toast.error('Error al eliminar vehiculo')
  }
}

onMounted(() => loadVehicle())
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoadingData" class="flex items-center justify-center py-12">
      <Loader2 class="size-6 animate-spin text-muted-foreground" />
    </div>

    <!-- Content: 2 columns on desktop -->
    <div v-else class="grid gap-4 lg:grid-cols-3">
      <!-- Left column: Form + Delete (2/3) -->
      <div class="space-y-4 lg:col-span-2">
        <!-- Edit Form -->
        <Card>
          <CardContent class="p-5 md:p-6">
            <h3 class="mb-4 text-sm font-semibold">Editar informacion</h3>
            <form class="space-y-4" @submit.prevent="handleSubmit">
              <ErrorAlert v-if="error" :message="error" />

              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <Label for="vehicle-plate">Placa <span class="text-destructive">*</span></Label>
                  <Input
                    id="vehicle-plate"
                    v-model="formPlate"
                    placeholder="Ej: ABC123"
                    class="h-12 text-base uppercase"
                    required
                  />
                </div>
                <div class="space-y-1.5">
                  <Label for="vehicle-color">Color <span class="text-destructive">*</span></Label>
                  <Input
                    id="vehicle-color"
                    v-model="formColor"
                    placeholder="Ej: Blanco"
                    class="h-12 text-base"
                    required
                  />
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <Label for="vehicle-brand">Marca <span class="text-destructive">*</span></Label>
                  <Input
                    id="vehicle-brand"
                    v-model="formBrand"
                    placeholder="Ej: Toyota"
                    class="h-12 text-base"
                    required
                  />
                </div>
                <div class="space-y-1.5">
                  <Label for="vehicle-model">Modelo <span class="text-destructive">*</span></Label>
                  <Input
                    id="vehicle-model"
                    v-model="formModel"
                    placeholder="Ej: Corolla"
                    class="h-12 text-base"
                    required
                  />
                </div>
              </div>

              <div class="space-y-1.5">
                <Label for="vehicle-owner">Propietario</Label>
                <Select v-model="formOwnerMemberId">
                  <SelectTrigger id="vehicle-owner" size="lg" class="text-base">
                    <SelectValue placeholder="Seleccionar (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    <SelectItem v-for="member in members" :key="member.id" :value="member.id">
                      {{ member.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                class="h-12 w-full text-base font-semibold sm:w-auto sm:px-8"
                :disabled="!canSubmit"
              >
                <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
                {{ isSubmitting ? 'Guardando...' : 'Guardar cambios' }}
              </Button>
            </form>
          </CardContent>
        </Card>

        <!-- Delete Section -->
        <Card class="border-destructive/20">
          <CardContent class="flex items-center justify-between p-5 md:p-6">
            <div>
              <p class="font-medium text-destructive">Eliminar vehiculo</p>
              <p class="text-sm text-muted-foreground">Esta accion no se puede deshacer.</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button variant="destructive" size="sm">
                  <Trash2 class="mr-2 size-4" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar vehiculo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminara el vehiculo con placa <span class="font-mono font-medium text-foreground">{{ formPlate }}</span>. Esta accion no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    @click="handleDelete"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      <!-- Right column: QR Pass (1/3) -->
      <div>
        <Card>
          <CardContent class="flex flex-col items-center p-5 md:p-6">
            <!-- Header -->
            <div class="mb-3 flex items-center gap-2">
              <QrCode class="size-4 text-primary" />
              <h3 class="text-sm font-semibold">Pase de Acceso QR</h3>
            </div>

            <!-- Has pass: QR + metadata + actions -->
            <template v-if="currentVehicle?.hasPass">
              <img
                v-if="qrImageUrl"
                :src="qrImageUrl"
                alt="QR de acceso del vehiculo"
                class="size-48 rounded-lg md:size-56"
              >

              <Separator class="my-3 w-full" />

              <div class="w-full space-y-1.5 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-muted-foreground">Tipo</span>
                  <Badge variant="secondary" class="text-[11px]">Multi-uso</Badge>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-muted-foreground">Estado</span>
                  <Badge variant="default" class="text-[11px]">Activo</Badge>
                </div>
              </div>

              <Separator class="my-3 w-full" />

              <div class="flex w-full gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  class="flex-1"
                  @click="handleSharePass"
                >
                  <Share2 class="mr-1.5 size-3.5" />
                  Compartir
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger as-child>
                    <Button variant="outline" size="sm" class="flex-1 text-destructive hover:text-destructive">
                      <Ban class="mr-1.5 size-3.5" />
                      Revocar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revocar pase QR</AlertDialogTitle>
                      <AlertDialogDescription>
                        El pase actual dejara de funcionar. Podras generar uno nuevo despues.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        @click="handleRevokePass"
                      >
                        Revocar Pase
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <!-- Download badge -->
              <Button
                class="mt-2 h-10 w-full text-sm"
                :disabled="isDownloadingBadge"
                @click="handleDownloadBadge"
              >
                <Loader2 v-if="isDownloadingBadge" class="size-4 animate-spin" />
                <Download v-else class="size-4" />
                Descargar Credencial
              </Button>
            </template>

            <!-- No pass: generate -->
            <template v-else>
              <div class="py-4 text-center">
                <Shield class="mx-auto mb-2 size-8 text-muted-foreground/50" />
                <p class="text-sm text-muted-foreground">Sin pase de acceso</p>
              </div>
              <Button
                class="w-full"
                :disabled="isGeneratingQr || isSubmitting"
                @click="handleGeneratePass"
              >
                <Loader2 v-if="isGeneratingQr" class="mr-2 size-4 animate-spin" />
                <QrCode v-else class="mr-2 size-4" />
                {{ isGeneratingQr ? 'Generando...' : 'Generar Pase QR' }}
              </Button>
            </template>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
