<script setup lang="ts">
import { Camera, Download, Loader2, RefreshCw, ScanLine, Shield } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import QRCode from 'qrcode'
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const staffId = route.params.id as string

const { staffList, isLoading, isSubmitting, error, fetchStaff, updateStaffMember, uploadAvatar, generateQr, roleOptions, fetchRoles } = useStaff()

// Breadcrumb
const pageOverride = computed(() => ({
  title: 'Editar personal',
  breadcrumbs: [{ label: 'Personal', to: '/admin/personal' }],
}))
usePageInfoOverride(pageOverride)

// Form state
const formName = ref('')
const formRole = ref('')
const formDocument = ref('')
const formPhone = ref('')
const formEmail = ref('')
const formShift = ref('none')

const activeRoles = computed(() => roleOptions.value.filter(r => r.isActive))

const memberLoaded = ref(false)

// Avatar state
const fileInput = ref<HTMLInputElement | null>(null)
const uploadingAvatar = ref(false)

// QR state
const qrToken = ref<string | null>(null)
const qrDataUrl = ref<string | null>(null)
const isLoadingQr = ref(false)
const isRegenerating = ref(false)
const confirmRegenerate = ref(false)

// Computed
const currentStaff = computed(() => staffList.value.find(s => s.id === staffId))

const initials = computed(() => {
  if (!formName.value) return '?'
  return formName.value
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const avatarUrl = computed(() => currentStaff.value?.avatar ?? null)

watch(staffList, (list) => {
  if (memberLoaded.value) return
  const staff = list.find(s => s.id === staffId)
  if (staff) {
    formName.value = staff.name
    formRole.value = staff.roleId ?? ''
    formDocument.value = staff.idDocument ?? ''
    formPhone.value = staff.phone ?? ''
    formEmail.value = staff.email ?? ''
    formShift.value = staff.shift ?? 'none'
    qrToken.value = staff.qrToken ?? null
    memberLoaded.value = true
  }
}, { immediate: true })

const canSubmit = computed(() =>
  formName.value.trim().length > 0
  && formRole.value
  && !isSubmitting.value,
)

// QR generation
async function generateQrImage() {
  if (!qrToken.value) {
    qrDataUrl.value = null
    return
  }
  const accessUrl = `${window.location.origin}/acceso/${qrToken.value}`
  qrDataUrl.value = await QRCode.toDataURL(accessUrl, { width: 250, margin: 2 })
}

// Avatar upload
async function handleAvatarChange(event: Event) {
  const { compressImage } = useImageCompress()
  const input = event.target as HTMLInputElement
  const rawFile = input.files?.[0]
  if (!rawFile) return

  uploadingAvatar.value = true
  try {
    const file = await compressImage(rawFile)
    await uploadAvatar(staffId, file)
    toast.success('Foto actualizada')
  }
  catch {
    toast.error('Error al subir la foto')
  }
  finally {
    uploadingAvatar.value = false
    input.value = ''
  }
}

// QR generate / regenerate
async function handleGenerateQr() {
  isLoadingQr.value = true
  try {
    const result = await generateQr(staffId)
    qrToken.value = result.qrToken
    await generateQrImage()
    toast.success('QR generado correctamente')
  }
  catch {
    toast.error(error.value ?? 'Error al generar QR')
  }
  finally {
    isLoadingQr.value = false
  }
}

async function handleRegenerateQr() {
  if (!confirmRegenerate.value) {
    confirmRegenerate.value = true
    return
  }

  isRegenerating.value = true
  confirmRegenerate.value = false
  try {
    const result = await generateQr(staffId)
    qrToken.value = result.qrToken
    await generateQrImage()
    toast.success('QR regenerado correctamente')
  }
  catch {
    toast.error(error.value ?? 'Error al regenerar QR')
  }
  finally {
    isRegenerating.value = false
  }
}

function cancelRegenerate() {
  confirmRegenerate.value = false
}

// Badge download
const { downloadBadge, isGenerating: isDownloadingBadge } = useQrBadge()

const currentRoleName = computed(() =>
  roleOptions.value.find(r => r.id === formRole.value)?.name ?? null,
)


async function handleDownloadBadge(format: 'png' | 'svg' = 'png') {
  if (!qrToken.value) return
  await downloadBadge({
    name: formName.value,
    roleName: currentRoleName.value,
    unitNumber: null,
    unitLabel: null,
    phone: formPhone.value || null,
    qrToken: qrToken.value,
  }, format)
  toast.success(`Credencial descargada como ${format.toUpperCase()}`)
}

// Form submit
async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    await updateStaffMember(staffId, {
      name: formName.value.trim(),
      roleId: formRole.value,
      idDocument: formDocument.value.trim() || undefined,
      phone: formPhone.value.trim() || undefined,
      email: formEmail.value.trim() || undefined,
      shift: formShift.value === 'none' ? undefined : formShift.value || undefined,
    })
    toast.success('Personal actualizado correctamente')
    router.push('/admin/personal')
  }
  catch {
    toast.error(error.value ?? 'Error al guardar')
  }
}

onMounted(async () => {
  await Promise.all([fetchStaff(), fetchRoles()])
  // Load QR token if staff has one
  if (currentStaff.value?.qrToken) {
    qrToken.value = currentStaff.value.qrToken
    await generateQrImage()
  }
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Loader2 class="size-6 animate-spin text-muted-foreground" />
    </div>

    <!-- Not found -->
    <div v-else-if="!memberLoaded && !isLoading" class="py-12 text-center">
      <p class="text-muted-foreground">Personal no encontrado</p>
      <Button variant="outline" class="mt-4" @click="router.push('/admin/personal')">
        Volver al listado
      </Button>
    </div>

    <!-- Content: 2 columns on desktop -->
    <div v-else class="grid gap-4 lg:grid-cols-3">
      <!-- Left column: Avatar + Form (2/3) -->
      <div class="space-y-4 lg:col-span-2">
        <!-- Avatar + Identity card -->
        <Card>
          <CardContent class="p-5 md:p-6">
            <div class="flex items-start gap-4">
              <!-- Avatar with upload -->
              <div class="relative shrink-0">
                <Avatar class="size-16 md:size-20">
                  <AvatarImage v-if="avatarUrl" :src="avatarUrl" :alt="formName" />
                  <AvatarFallback class="bg-primary/10 text-xl font-semibold text-primary md:text-2xl">
                    {{ initials }}
                  </AvatarFallback>
                </Avatar>
                <button
                  class="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  aria-label="Cambiar foto de perfil"
                  :disabled="uploadingAvatar"
                  @click="fileInput?.click()"
                >
                  <Camera class="size-3" />
                </button>
                <div v-if="uploadingAvatar" class="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                  <Loader2 class="size-5 animate-spin" />
                </div>
              </div>
              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                class="hidden"
                @change="handleAvatarChange"
              >

              <!-- Name + role -->
              <div class="min-w-0 flex-1">
                <h2 class="truncate text-lg font-semibold">{{ formName || 'Sin nombre' }}</h2>
                <Badge v-if="formRole" variant="secondary" class="mt-1">{{ roleOptions.find(r => r.id === formRole)?.name ?? 'Sin rol' }}</Badge>
                <p class="mt-2 text-sm text-muted-foreground">
                  Haz click en el icono de camara para cambiar la foto de perfil
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Editable form -->
        <Card>
          <CardContent class="p-5 md:p-8">
            <h3 class="mb-4 text-sm font-semibold">Editar informacion</h3>
            <form class="space-y-6" @submit.prevent="handleSubmit">
              <ErrorAlert v-if="error" :message="error" />

              <!-- Nombre + Cédula -->
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <Label for="staff-name">Nombre <span class="text-destructive">*</span></Label>
                  <Input
                    id="staff-name"
                    v-model="formName"
                    placeholder="Nombre completo"
                    class="h-12 text-base"
                    required
                  />
                </div>
                <div class="space-y-1.5">
                  <Label for="staff-document">Cédula</Label>
                  <Input
                    id="staff-document"
                    v-model="formDocument"
                    placeholder="V-12345678"
                    class="h-12 text-base"
                  />
                </div>
              </div>

              <!-- Teléfono + Email -->
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <Label for="staff-phone">Teléfono</Label>
                  <Input
                    id="staff-phone"
                    v-model="formPhone"
                    placeholder="0412-1234567"
                    class="h-12 text-base"
                  />
                </div>
                <div class="space-y-1.5">
                  <Label for="staff-email">Email</Label>
                  <Input
                    id="staff-email"
                    v-model="formEmail"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    class="h-12 text-base"
                  />
                </div>
              </div>

              <!-- Turno + Rol -->
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <Label for="staff-shift">Turno</Label>
                  <Select v-model="formShift">
                    <SelectTrigger id="staff-shift" size="lg" class="text-base">
                      <SelectValue placeholder="Seleccionar turno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      <SelectItem value="mañana">Mañana</SelectItem>
                      <SelectItem value="tarde">Tarde</SelectItem>
                      <SelectItem value="noche">Noche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-1.5">
                  <Label for="staff-role">Rol <span class="text-destructive">*</span></Label>
                  <Select v-model="formRole">
                    <SelectTrigger id="staff-role" size="lg" class="text-base">
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="role in activeRoles" :key="role.id" :value="role.id">
                        {{ role.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
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

            <!-- Has QR token: show QR image -->
            <template v-if="qrToken">
              <img
                v-if="qrDataUrl"
                :src="qrDataUrl"
                alt="QR de acceso del personal"
                class="size-48 rounded-lg md:size-56"
              >
              <Skeleton v-else class="size-48 rounded-lg md:size-56" />

              <Separator class="my-3 w-full" />

              <!-- QR details -->
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

              <!-- Regenerate action -->
              <div class="w-full space-y-2">
                <div v-if="confirmRegenerate" class="space-y-2">
                  <p class="text-center text-sm text-muted-foreground">
                    Esto invalidara el QR actual y generara uno nuevo
                  </p>
                  <div class="flex gap-2">
                    <Button
                      variant="outline"
                      class="h-10 flex-1 text-sm"
                      @click="cancelRegenerate"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      class="h-10 flex-1 text-sm"
                      :disabled="isRegenerating"
                      @click="handleRegenerateQr"
                    >
                      <Loader2 v-if="isRegenerating" class="size-4 animate-spin" />
                      <RefreshCw v-else class="size-4" />
                      Confirmar
                    </Button>
                  </div>
                </div>
                <Button
                  v-else
                  variant="outline"
                  class="h-10 w-full text-sm"
                  :disabled="isRegenerating"
                  @click="handleRegenerateQr"
                >
                  <RefreshCw class="size-4" />
                  Regenerar QR
                </Button>

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
              </div>
            </template>

            <!-- No QR token: show empty state + generate button -->
            <template v-else>
              <div class="py-4 text-center">
                <Shield class="mx-auto mb-2 size-8 text-muted-foreground/50" />
                <p class="text-sm text-muted-foreground">
                  Este miembro no tiene QR asignado
                </p>
              </div>

              <Button
                class="h-10 w-full text-sm"
                :disabled="isLoadingQr"
                @click="handleGenerateQr"
              >
                <Loader2 v-if="isLoadingQr" class="size-4 animate-spin" />
                <ScanLine v-else class="size-4" />
                Generar QR
              </Button>
            </template>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
