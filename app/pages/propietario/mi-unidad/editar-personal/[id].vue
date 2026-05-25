<script setup lang="ts">
import QRCode from 'qrcode'
import { Download, Loader2, QrCode, Share2, Ban, ClipboardList, CheckCircle, XCircle, Clock, Trash2, Shield } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { StaffAttendanceLog } from '~~/shared/types/unit-service-staff'

useHead({ title: 'Editar Personal' })

const route = useRoute()
const router = useRouter()
const staffId = route.params.id as string

const {
  serviceStaff,
  serviceRoles,
  isSubmitting,
  error,
  fetchServiceStaff,
  fetchServiceRoles,
  updateServiceStaff,
  deleteServiceStaff,
  generateStaffPass,
  revokeStaffPass,
  fetchStaffAttendance,
} = useMyUnit()

const { downloadBadge, isGenerating: isDownloadingBadge } = useQrBadge()

const formName = ref('')
const formRoleId = ref('')
const formDocument = ref('')
const formPhone = ref('')

const isLoadingData = ref(true)
const qrDataUrl = ref<string | null>(null)
const isGeneratingQr = ref(false)
const attendanceLogs = ref<StaffAttendanceLog[]>([])

const canSubmit = computed(() =>
  formName.value.trim().length > 0
  && formRoleId.value !== ''
  && formDocument.value.trim().length > 0
  && !isSubmitting.value,
)

const currentStaff = computed(() =>
  serviceStaff.value.find(s => s.id === staffId),
)

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
  return new Date(iso).toLocaleDateString('es', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function generateQrImage(token: string) {
  const url = `${window.location.origin}/acceso/${token}`
  qrDataUrl.value = await QRCode.toDataURL(url, {
    width: 280,
    margin: 2,
    color: { dark: '#1F2933' },
  })
}

async function loadData() {
  isLoadingData.value = true
  try {
    const [, , logs] = await Promise.all([
      fetchServiceStaff(),
      fetchServiceRoles(),
      fetchStaffAttendance(staffId),
    ])
    attendanceLogs.value = logs

    const staff = serviceStaff.value.find(s => s.id === staffId)
    if (!staff) {
      toast.error('Personal no encontrado')
      router.replace('/propietario/mi-unidad?tab=staff')
      return
    }

    formName.value = staff.name
    formRoleId.value = staff.roleId
    formDocument.value = staff.idDocument ?? ''
    formPhone.value = staff.phone ?? ''

    if (staff.hasPass && staff.passToken) {
      await generateQrImage(staff.passToken)
    }
  }
  catch {
    toast.error('Error al cargar datos')
  }
  finally {
    isLoadingData.value = false
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    await updateServiceStaff(staffId, {
      name: formName.value.trim(),
      roleId: formRoleId.value,
      idDocument: formDocument.value.trim() || undefined,
      phone: formPhone.value.trim() || undefined,
    })
    toast.success('Personal actualizado correctamente')
    router.push('/propietario/mi-unidad?tab=staff')
  }
  catch {
    toast.error(error.value ?? 'Error al guardar')
  }
}

async function handleGeneratePass() {
  isGeneratingQr.value = true
  try {
    const pass = await generateStaffPass(staffId)
    await generateQrImage(pass.token)
    toast.success('Pase QR generado correctamente')
  }
  catch {
    toast.error(error.value ?? 'Error al generar pase')
  }
  finally {
    isGeneratingQr.value = false
  }
}

async function handleSharePass() {
  const staff = currentStaff.value
  if (!staff?.passToken) return

  const url = `${window.location.origin}/acceso/${staff.passToken}`
  try {
    if (navigator.share) {
      await navigator.share({
        title: `Pase de acceso — ${staff.name}`,
        url,
      })
    }
    else {
      await navigator.clipboard.writeText(url)
      toast.success('Enlace copiado al portapapeles')
    }
  }
  catch (err: unknown) {
    if (err instanceof Error && err.name !== 'AbortError') {
      await navigator.clipboard.writeText(url)
      toast.success('Enlace copiado al portapapeles')
    }
  }
}

async function handleRevokePass() {
  try {
    await revokeStaffPass(staffId)
    qrDataUrl.value = null
    toast.success('Pase QR revocado')
  }
  catch {
    toast.error(error.value ?? 'Error al revocar pase')
  }
}

async function handleDelete() {
  try {
    await deleteServiceStaff(staffId)
    toast.success('Personal eliminado correctamente')
    router.push('/propietario/mi-unidad?tab=staff')
  }
  catch {
    toast.error(error.value ?? 'Error al eliminar')
  }
}

const currentRoleName = computed(() =>
  serviceRoles.value.find(r => r.id === formRoleId.value)?.name ?? null,
)

async function handleDownloadBadge() {
  if (!currentStaff.value?.passToken) return
  await downloadBadge({
    name: formName.value,
    roleName: currentRoleName.value,
    phone: formPhone.value || null,
    qrToken: currentStaff.value.passToken,
  })
  toast.success('Credencial descargada')
}

onMounted(() => loadData())
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoadingData" class="flex items-center justify-center py-12">
      <Loader2 class="size-6 animate-spin text-muted-foreground" />
    </div>

    <!-- Content: 2 columns on desktop -->
    <div v-else class="grid gap-4 lg:grid-cols-3">
      <!-- Left column: Form + Attendance + Delete (2/3) -->
      <div class="space-y-4 lg:col-span-2">
        <!-- Edit Form -->
        <Card>
          <CardContent class="p-5 md:p-6">
            <h3 class="mb-4 text-sm font-semibold">Editar informacion</h3>
            <form class="space-y-4" @submit.prevent="handleSubmit">
              <ErrorAlert v-if="error" :message="error" />

              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <Label for="staff-name">Nombre completo <span class="text-destructive">*</span></Label>
                  <Input
                    id="staff-name"
                    v-model="formName"
                    placeholder="Nombre completo"
                    class="h-12 text-base"
                    required
                  />
                </div>
                <div class="space-y-1.5">
                  <Label for="staff-role">Rol <span class="text-destructive">*</span></Label>
                  <Select v-model="formRoleId">
                    <SelectTrigger id="staff-role" size="lg" class="text-base">
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="role in serviceRoles" :key="role.id" :value="role.id">
                        {{ role.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <Label for="staff-document">Cédula <span class="text-destructive">*</span></Label>
                  <Input
                    id="staff-document"
                    v-model="formDocument"
                    placeholder="V-12345678"
                    class="h-12 text-base"
                    required
                  />
                </div>
                <div class="space-y-1.5">
                  <Label for="staff-phone">Telefono</Label>
                  <Input
                    id="staff-phone"
                    v-model="formPhone"
                    placeholder="0412-1234567"
                    type="tel"
                    class="h-12 text-base"
                  />
                </div>
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

        <!-- Attendance History -->
        <Card>
          <CardContent class="p-5 md:p-6">
            <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold">
              <ClipboardList class="size-4" />
              Historial de Asistencia
            </h3>

            <div v-if="attendanceLogs.length === 0" class="py-6 text-center">
              <Clock class="mx-auto mb-2 size-8 text-muted-foreground/50" />
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
          </CardContent>
        </Card>

        <!-- Delete Section -->
        <Card class="border-destructive/20">
          <CardContent class="flex items-center justify-between p-5 md:p-6">
            <div>
              <p class="font-medium text-destructive">Eliminar personal</p>
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
                  <AlertDialogTitle>Eliminar personal</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminara permanentemente a {{ currentStaff?.name }} y todos sus datos asociados. Esta accion no se puede deshacer.
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
            <template v-if="currentStaff?.hasPass">
              <img
                v-if="qrDataUrl"
                :src="qrDataUrl"
                alt="QR de acceso"
                class="size-48 rounded-lg md:size-56"
              />

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
                        El pase QR actual dejara de funcionar y deberas generar uno nuevo si lo necesitas.
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
