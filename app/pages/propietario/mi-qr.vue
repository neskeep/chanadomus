<script setup lang="ts">
import { Download, Loader2, RefreshCw, ScanLine } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import QRCode from 'qrcode'

useHead({ title: 'Mi QR Personal' })

const { pass, isLoading, error, fetchMyPass, regeneratePass } = useResidentPass()
const { formatDateTime } = useFormatDate()
const { user, role } = useAuth()
const { downloadBadge, isGenerating: isDownloadingBadge } = useQrBadge()

const qrDataUrl = ref<string | null>(null)
const isRegenerating = ref(false)
const confirmRegenerate = ref(false)

async function generateQrImage() {
  if (!pass.value) return
  const accessUrl = `${window.location.origin}/acceso/${pass.value.token}`
  qrDataUrl.value = await QRCode.toDataURL(accessUrl, { width: 300, margin: 2 })
}

onMounted(async () => {
  await fetchMyPass()
  await generateQrImage()
})

const isExpired = computed(() => {
  if (!pass.value?.expiresAt) return false
  return new Date(pass.value.expiresAt) < new Date()
})

async function handleRegenerate() {
  if (!confirmRegenerate.value) {
    confirmRegenerate.value = true
    return
  }

  isRegenerating.value = true
  confirmRegenerate.value = false

  try {
    await regeneratePass()
    await generateQrImage()
  }
  catch {
    // Error handled by composable
  }
  finally {
    isRegenerating.value = false
  }
}

function cancelRegenerate() {
  confirmRegenerate.value = false
}

async function handleDownloadBadge() {
  if (!pass.value?.token) return
  await downloadBadge({
    name: user.value?.name ?? 'Residente',
    roleName: role.value === 'propietario' ? 'Propietario' : 'Residente',
    unitNumber: pass.value.unitNumber || null,
    unitLabel: pass.value.unitLabel || null,
    phone: null,
    qrToken: pass.value.token,
  })
  toast.success('Credencial descargada')
}
</script>

<template>
  <div class="space-y-4">
    <!-- Error alert -->
    <ErrorAlert :message="error" class="mb-4" />

    <!-- Loading state -->
    <Card v-if="isLoading && !pass">
      <CardContent class="flex flex-col items-center space-y-4 p-6">
        <Skeleton class="size-72 rounded-lg" />
        <Separator />
        <div class="w-full space-y-3">
          <Skeleton class="h-5 w-full" />
          <Skeleton class="h-5 w-3/4" />
          <Skeleton class="h-5 w-1/2" />
        </div>
      </CardContent>
    </Card>

    <!-- QR Card -->
    <template v-else-if="pass">
      <Card>
        <CardContent class="flex flex-col items-center space-y-4 p-6">
          <!-- QR Image -->
          <div class="flex flex-col items-center gap-3">
            <div class="flex items-center gap-2">
              <ScanLine class="size-5 text-primary" />
              <h2 class="text-lg font-semibold">Mi QR Personal</h2>
            </div>
            <p class="text-center text-sm text-muted-foreground">
              Muestra este codigo en la alcabala para acceder rapidamente
            </p>
          </div>

          <img
            v-if="qrDataUrl"
            :src="qrDataUrl"
            alt="QR de acceso personal del residente"
            class="size-72 rounded-lg"
          >

          <Separator />

          <!-- Pass info -->
          <div class="w-full space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Tipo</span>
              <Badge variant="secondary">Multi-uso</Badge>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Estado</span>
              <Badge :variant="isExpired ? 'destructive' : 'default'">
                {{ isExpired ? 'Vencido' : 'Activo' }}
              </Badge>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Valido hasta</span>
              <span class="text-xs tabular-nums">{{ formatDateTime(pass.expiresAt) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Creado</span>
              <span class="text-xs tabular-nums">{{ formatDateTime(pass.createdAt) }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Regenerate action -->
      <div class="space-y-2">
        <div v-if="confirmRegenerate" class="space-y-2">
          <p class="text-center text-sm text-muted-foreground">
            Esto invalidara tu QR actual y generara uno nuevo
          </p>
          <div class="flex gap-2">
            <Button
              variant="outline"
              class="h-12 flex-1 text-base"
              @click="cancelRegenerate"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              class="h-12 flex-1 text-base"
              :disabled="isRegenerating"
              @click="handleRegenerate"
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
          class="h-12 w-full text-base"
          :disabled="isRegenerating"
          @click="handleRegenerate"
        >
          <RefreshCw class="size-4" />
          Regenerar QR
        </Button>
      </div>

      <Button
        class="h-12 w-full text-base"
        :disabled="isDownloadingBadge"
        @click="handleDownloadBadge"
      >
        <Loader2 v-if="isDownloadingBadge" class="size-4 animate-spin" />
        <Download v-else class="size-4" />
        Descargar Credencial
      </Button>
    </template>
  </div>
</template>
