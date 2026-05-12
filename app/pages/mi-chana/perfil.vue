<script setup lang="ts">
import { Camera, Loader2, ScanLine, Mail, Building2, Phone, Shield } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ROLE_LABELS } from '~~/shared/types/auth'
import type { UserRole } from '~~/shared/types/auth'
import QRCode from 'qrcode'

useHead({ title: 'Mi Perfil' })

const { profile, isLoading, isSubmitting, error, fetchProfile, updateProfile, uploadAvatar } = useProfile()
const { role } = useAuth()

// QR pass (only for propietario)
const { pass, isLoading: isLoadingPass, fetchMyPass } = useResidentPass()
const qrDataUrl = ref<string | null>(null)
const { formatDateTime } = useFormatDate()

const formName = ref('')
const formPhone = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const uploadingAvatar = ref(false)

const initials = computed(() => {
  if (!profile.value?.name) return '?'
  return profile.value.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const roleLabel = computed(() => {
  if (!profile.value?.role) return ''
  return ROLE_LABELS[profile.value.role as UserRole] ?? profile.value.role
})

const isPropietario = computed(() => role.value === 'propietario')

const isExpired = computed(() => {
  if (!pass.value?.expiresAt) return false
  return new Date(pass.value.expiresAt) < new Date()
})

watch(profile, (val) => {
  if (val) {
    formName.value = val.name ?? ''
    formPhone.value = val.phone ?? ''
  }
}, { immediate: true })

async function generateQrImage() {
  if (!pass.value) return
  const accessUrl = `${window.location.origin}/acceso/${pass.value.token}`
  qrDataUrl.value = await QRCode.toDataURL(accessUrl, { width: 250, margin: 2 })
}

async function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadingAvatar.value = true
  try {
    await uploadAvatar(file)
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

async function handleSubmit() {
  try {
    await updateProfile({
      name: formName.value.trim(),
      phone: formPhone.value.trim() || null,
    })
    toast.success('Perfil actualizado')
  }
  catch {
    toast.error('Error al guardar los cambios')
  }
}

onMounted(async () => {
  await fetchProfile()
  if (isPropietario.value) {
    await fetchMyPass()
    await generateQrImage()
  }
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Loader2 class="size-8 animate-spin text-muted-foreground" />
    </div>

    <!-- Error -->
    <ErrorAlert v-else-if="error && !profile" :message="error" class="mb-4" />

    <!-- Content: 2 columns on desktop -->
    <div v-else-if="profile" class="grid gap-4 lg:grid-cols-3">
      <!-- Left column: Profile info + form (2/3) -->
      <div class="space-y-4 lg:col-span-2">
        <!-- Identity card -->
        <Card>
          <CardContent class="p-5 md:p-6">
            <div class="flex items-start gap-4">
              <!-- Avatar -->
              <div class="relative shrink-0">
                <Avatar class="size-16 md:size-20">
                  <AvatarImage v-if="profile.image" :src="profile.image" :alt="profile.name" />
                  <AvatarFallback class="bg-primary/10 text-primary text-xl font-semibold md:text-2xl">
                    {{ initials }}
                  </AvatarFallback>
                </Avatar>
                <button
                  class="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  aria-label="Cambiar foto"
                  :disabled="isSubmitting"
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
                accept="image/jpeg,image/png,image/webp"
                class="hidden"
                @change="handleAvatarChange"
              />

              <!-- Name + role + details -->
              <div class="min-w-0 flex-1">
                <h2 class="truncate text-lg font-semibold">{{ profile.name }}</h2>
                <Badge variant="secondary" class="mt-1">{{ roleLabel }}</Badge>

                <div class="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div class="flex items-center gap-2 text-muted-foreground">
                    <Mail class="size-3.5 shrink-0" />
                    <span class="truncate">{{ profile.email }}</span>
                  </div>
                  <div v-if="profile.unitNumber" class="flex items-center gap-2 text-muted-foreground">
                    <Building2 class="size-3.5 shrink-0" />
                    <span>{{ profile.unitLabel ?? profile.unitNumber }}</span>
                  </div>
                  <div v-if="profile.phone" class="flex items-center gap-2 text-muted-foreground">
                    <Phone class="size-3.5 shrink-0" />
                    <span>{{ profile.phone }}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Editable form -->
        <Card>
          <CardContent class="p-5 md:p-6">
            <h3 class="mb-4 text-sm font-semibold">Editar información</h3>
            <form class="space-y-4" @submit.prevent="handleSubmit">
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <Label for="profile-name">Nombre</Label>
                  <Input id="profile-name" v-model="formName" placeholder="Tu nombre" class="h-12 text-base" />
                </div>
                <div class="space-y-1.5">
                  <Label for="profile-phone">Teléfono</Label>
                  <Input id="profile-phone" v-model="formPhone" placeholder="0412-1234567" class="h-12 text-base" />
                </div>
              </div>
              <Button type="submit" class="h-12 w-full text-base font-semibold sm:w-auto sm:px-8" :disabled="!formName.trim() || isSubmitting">
                <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
                {{ isSubmitting ? 'Guardando...' : 'Guardar cambios' }}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <!-- Right column: QR pass (1/3, only propietario) -->
      <div v-if="isPropietario" class="space-y-4">
        <Card>
          <CardContent class="flex flex-col items-center p-5 md:p-6">
            <!-- Header -->
            <div class="mb-3 flex items-center gap-2">
              <ScanLine class="size-4 text-primary" />
              <h3 class="text-sm font-semibold">Mi QR de Acceso</h3>
            </div>

            <!-- Loading -->
            <div v-if="isLoadingPass && !pass" class="flex flex-col items-center gap-3 py-4">
              <Skeleton class="size-48 rounded-lg" />
              <Skeleton class="h-4 w-32" />
            </div>

            <!-- QR image -->
            <template v-else-if="pass">
              <img
                v-if="qrDataUrl"
                :src="qrDataUrl"
                alt="QR de acceso personal"
                class="size-48 rounded-lg md:size-56"
              />

              <Separator class="my-3 w-full" />

              <!-- Pass details -->
              <div class="w-full space-y-1.5 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-muted-foreground">Tipo</span>
                  <Badge variant="secondary" class="text-[11px]">Multi-uso</Badge>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-muted-foreground">Estado</span>
                  <Badge :variant="isExpired ? 'destructive' : 'default'" class="text-[11px]">
                    {{ isExpired ? 'Vencido' : 'Activo' }}
                  </Badge>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-muted-foreground">Válido hasta</span>
                  <span class="text-xs tabular-nums text-muted-foreground">{{ formatDateTime(pass.expiresAt) }}</span>
                </div>
              </div>
            </template>

            <!-- No pass -->
            <div v-else class="py-4 text-center text-sm text-muted-foreground">
              <Shield class="mx-auto mb-2 size-8 text-muted-foreground/50" />
              <p>No tienes un QR asignado</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
