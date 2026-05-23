<script setup lang="ts">
import { Download, Loader2, QrCode, Share2, Ban, Trash2, Shield } from 'lucide-vue-next'
import QRCode from 'qrcode'
import { toast } from 'vue-sonner'
import type { HouseholdRelationship } from '~~/shared/types/household'

const { downloadBadge, isGenerating: isDownloadingBadge } = useQrBadge()

const RELATIONSHIP_LABELS: Record<string, string> = {
  owner: 'Propietario',
  spouse: 'Cónyuge',
  child: 'Hijo/a',
  tenant: 'Inquilino',
  other: 'Otro',
}

useHead({ title: 'Editar Integrante' })

const route = useRoute()
const router = useRouter()
const memberId = route.params.id as string

const {
  members,
  isSubmitting,
  error,
  fetchMembers,
  updateMember,
  deleteMember,
  generateMemberPass,
  revokeMemberPass,
} = useMyUnit()

const formName = ref('')
const formRelationship = ref<HouseholdRelationship | ''>('')
const formDocument = ref('')
const formPhone = ref('')

const isLoadingData = ref(true)
const qrDataUrl = ref<string | null>(null)
const isGeneratingQr = ref(false)

const canSubmit = computed(() =>
  formName.value.trim().length > 0
  && formRelationship.value !== ''
  && !isSubmitting.value,
)

const currentMember = computed(() =>
  members.value.find(m => m.id === memberId),
)

async function generateQrImage(token: string) {
  const url = `${window.location.origin}/acceso/${token}`
  qrDataUrl.value = await QRCode.toDataURL(url, {
    width: 280,
    margin: 2,
    color: { dark: '#1F2933' },
  })
}

async function loadMember() {
  isLoadingData.value = true
  try {
    await fetchMembers()
    const member = currentMember.value
    if (!member) {
      toast.error('Integrante no encontrado')
      router.replace('/propietario/mi-unidad?tab=members')
      return
    }
    formName.value = member.name
    formRelationship.value = member.relationship
    formDocument.value = member.idDocument ?? ''
    formPhone.value = member.phone ?? ''

    if (member.hasPass && member.passToken) {
      await generateQrImage(member.passToken)
    }
  }
  catch {
    toast.error('Error al cargar integrante')
  }
  finally {
    isLoadingData.value = false
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    await updateMember(memberId, {
      name: formName.value.trim(),
      relationship: formRelationship.value as HouseholdRelationship,
      idDocument: formDocument.value.trim() || undefined,
      phone: formPhone.value.trim() || undefined,
    })
    toast.success('Integrante actualizado correctamente')
    router.push('/propietario/mi-unidad?tab=members')
  }
  catch {
    toast.error(error.value ?? 'Error al guardar')
  }
}

async function handleGeneratePass() {
  isGeneratingQr.value = true
  try {
    const pass = await generateMemberPass(memberId)
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
  const member = currentMember.value
  if (!member?.passToken) return

  const url = `${window.location.origin}/acceso/${member.passToken}`
  try {
    if (navigator.share) {
      await navigator.share({
        title: `Pase de Acceso — ${member.name}`,
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
    await revokeMemberPass(memberId)
    qrDataUrl.value = null
    toast.success('Pase revocado correctamente')
  }
  catch {
    toast.error(error.value ?? 'Error al revocar pase')
  }
}

async function handleDelete() {
  try {
    await deleteMember(memberId)
    toast.success('Integrante eliminado correctamente')
    router.push('/propietario/mi-unidad?tab=members')
  }
  catch {
    toast.error(error.value ?? 'Error al eliminar integrante')
  }
}

async function handleDownloadBadge() {
  if (!currentMember.value?.passToken) return
  await downloadBadge({
    name: formName.value,
    roleName: RELATIONSHIP_LABELS[formRelationship.value] ?? null,
    phone: formPhone.value || null,
    qrToken: currentMember.value.passToken,
  })
  toast.success('Credencial descargada')
}

onMounted(() => loadMember())
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
                  <Label for="member-name">Nombre completo <span class="text-destructive">*</span></Label>
                  <Input
                    id="member-name"
                    v-model="formName"
                    placeholder="Nombre completo"
                    class="h-12 text-base"
                    required
                  />
                </div>
                <div class="space-y-1.5">
                  <Label for="member-relationship">Parentesco <span class="text-destructive">*</span></Label>
                  <Select v-model="formRelationship">
                    <SelectTrigger id="member-relationship" size="lg" class="text-base">
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
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <Label for="member-document">Documento de identidad</Label>
                  <Input
                    id="member-document"
                    v-model="formDocument"
                    placeholder="Cedula o pasaporte"
                    class="h-12 text-base"
                  />
                </div>
                <div class="space-y-1.5">
                  <Label for="member-phone">Telefono</Label>
                  <Input
                    id="member-phone"
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

        <!-- Delete Section -->
        <Card class="border-destructive/20">
          <CardContent class="flex items-center justify-between p-5 md:p-6">
            <div>
              <p class="font-medium text-destructive">Eliminar integrante</p>
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
                  <AlertDialogTitle>Eliminar integrante</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminara a {{ currentMember?.name }} de tu unidad. Si tiene un pase activo, tambien sera revocado.
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
            <template v-if="currentMember?.hasPass">
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
                      <AlertDialogTitle>Revocar pase de acceso</AlertDialogTitle>
                      <AlertDialogDescription>
                        El pase QR actual dejara de funcionar. Podras generar uno nuevo en cualquier momento.
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
                class="h-10 w-full text-sm"
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
