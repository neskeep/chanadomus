<script setup lang="ts">
import { Share2, ChevronDown, ChevronUp, Loader2, Ban } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { QrCodeRecord, QrStatus } from '~~/shared/types/qr'
import QRCode from 'qrcode'

const props = defineProps<{
  pass: QrCodeRecord
  isCanceling?: boolean
}>()

const emit = defineEmits<{
  cancel: [id: string]
}>()

const { formatDateTime } = useFormatDate()

const statusConfig: Record<QrStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  active: { label: 'Activo', variant: 'default' },
  used: { label: 'Usado', variant: 'secondary' },
  expired: { label: 'Expirado', variant: 'outline' },
  canceled: { label: 'Cancelado', variant: 'destructive' },
}

const isActive = computed(() => props.pass.status === 'active')

// --- QR expand / share ---
const isExpanded = ref(false)
const qrUrl = ref<string | null>(null)

async function toggleExpand() {
  if (!isActive.value) return

  if (isExpanded.value) {
    isExpanded.value = false
    qrUrl.value = null
    return
  }

  isExpanded.value = true
  const accessUrl = `${window.location.origin}/acceso/${props.pass.token}`
  qrUrl.value = await QRCode.toDataURL(accessUrl, { width: 200, margin: 2 })
}

async function handleShare() {
  const accessUrl = `${window.location.origin}/acceso/${props.pass.token}`
  const shareText = `Hola! Te comparto tu acceso a Ranchos de Chana. Muestra este enlace en la alcabala: ${accessUrl}`

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Acceso Ranchos de Chana',
        text: shareText,
        url: accessUrl,
      })
    }
    catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        await copyToClipboard(shareText)
      }
    }
  }
  else {
    await copyToClipboard(shareText)
  }
}

async function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    }
    else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    toast.success('Enlace copiado al portapapeles')
  }
  catch {
    toast.error('No se pudo copiar el enlace')
  }
}

// --- Cancel confirmation ---
const showCancelDialog = ref(false)

function confirmCancel() {
  emit('cancel', props.pass.id)
}
</script>

<template>
  <Card
    class="transition-shadow"
    :class="isActive ? 'cursor-pointer hover:shadow-sm' : 'opacity-75'"
    @click="isActive ? toggleExpand() : undefined"
  >
    <CardContent class="px-3 py-2.5">
      <div class="flex items-center gap-2">
        <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ pass.visitorName }}</p>
        <Badge :variant="statusConfig[pass.status].variant" class="shrink-0 text-[11px]">
          {{ statusConfig[pass.status].label }}
        </Badge>
        <Badge variant="outline" class="shrink-0 text-[11px]">
          {{ pass.visitorType === 'invitado' ? 'Invitado' : 'Proveedor' }}
        </Badge>
        <component
          :is="isExpanded ? ChevronUp : ChevronDown"
          v-if="isActive"
          class="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      <div class="mt-1 flex items-center gap-x-1 text-[11px] text-muted-foreground">
        <span class="truncate">{{ pass.unitLabel || pass.unitNumber }}</span>
        <span class="opacity-30" aria-hidden="true">&middot;</span>
        <span class="shrink-0 tabular-nums">{{ pass.usedAt ? formatDateTime(pass.usedAt) : formatDateTime(pass.expiresAt) }}</span>
      </div>

      <div
        v-if="isExpanded && isActive"
        class="mt-3 flex flex-col items-center gap-3 border-t pt-3"
      >
        <Loader2 v-if="!qrUrl" class="size-8 animate-spin text-muted-foreground" />
        <img
          v-else
          :src="qrUrl"
          alt="Codigo QR de acceso"
          class="size-48 rounded-lg"
        >
        <div class="flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" @click.stop="handleShare">
            <Share2 class="size-4" />
            Compartir
          </Button>
          <Button
            variant="ghost"
            class="text-destructive hover:bg-destructive/10 hover:text-destructive"
            :disabled="isCanceling"
            @click.stop="showCancelDialog = true"
          >
            <Ban class="size-4" />
            Cancelar
          </Button>
        </div>
      </div>
    </CardContent>

    <!-- Cancel confirmation -->
    <AlertDialog v-model:open="showCancelDialog">
      <AlertDialogContent @click.stop>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cancelar este pase?</AlertDialogTitle>
          <AlertDialogDescription>
            El pase de <span class="font-medium">{{ pass.visitorName }}</span> dejará de ser válido y el visitante ya no podrá ingresar. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isCanceling">Volver</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isCanceling"
            @click="confirmCancel"
          >
            {{ isCanceling ? 'Cancelando...' : 'Cancelar pase' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </Card>
</template>
