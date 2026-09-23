<script setup lang="ts">
import { Ban, Loader2, Pencil, QrCode, Share2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { QrPassItem, QrStatus } from '~~/shared/types/qr'

/**
 * Un pase de visita en "Mis Visitas". Las acciones dependen solo de
 * `canEdit` / `canCancel`, calculados en el servidor.
 */
interface Props {
  pass: QrPassItem
  /** Ruta de la página de edición de este pase */
  editTo: string
  isCanceling?: boolean
}

const props = withDefaults(defineProps<Props>(), { isCanceling: false })

const emit = defineEmits<{
  cancel: [id: string]
}>()

const { formatDateTime, formatTime } = useFormatDate()
const { sharePass, qrImage } = useShareVisitPass()

const STATUS: Record<QrStatus, { label: string; variant: 'default' | 'outline' | 'destructive' }> = {
  active: { label: 'Activo', variant: 'default' },
  used: { label: 'Usado', variant: 'outline' },
  expired: { label: 'Expirado', variant: 'outline' },
  canceled: { label: 'Cancelado', variant: 'destructive' },
}

const isActive = computed(() => props.pass.status === 'active')
const qrPanelId = computed(() => `qr-${props.pass.id}`)

/** Frase de vigencia según el estado del pase. */
const validityText = computed(() => {
  const p = props.pass
  switch (p.status) {
    case 'canceled':
      return p.canceledAt ? `Cancelado el ${formatDateTime(p.canceledAt)}` : 'Cancelado'
    case 'used': {
      const at = p.usedAt ?? p.lastAccessAt
      return at ? `Usado el ${formatDateTime(at)}` : 'Usado'
    }
    case 'expired':
      return `Venció el ${formatDateTime(p.expiresAt)} sin usarse`
    default:
      return p.expiresToday
        ? `Vence hoy a las ${formatTime(p.expiresAt)}`
        : `Válido hasta el ${formatDateTime(p.expiresAt)}`
  }
})

const showLastAccess = computed(() => props.pass.multiUse && !!props.pass.lastAccessAt && props.pass.status === 'active')

// --- QR y compartir ---
const isQrOpen = ref(false)
const qrUrl = ref<string | null>(null)

async function toggleQr() {
  isQrOpen.value = !isQrOpen.value
  if (isQrOpen.value && !qrUrl.value) {
    qrUrl.value = await qrImage(props.pass.token, 200)
  }
}

async function handleShare() {
  const result = await sharePass(props.pass.token)
  if (result === 'copied') toast.success('Enlace copiado. Pégalo en el chat con tu visitante.')
  else if (result === 'failed') toast.error('No se pudo copiar el enlace')
}

// --- Cancelar ---
const showCancelDialog = ref(false)
</script>

<template>
  <Card :class="isActive ? '' : 'bg-card/70'">
    <CardContent class="px-4 py-3">
      <div class="flex items-start gap-2">
        <p class="min-w-0 flex-1 break-words text-base font-semibold" :class="isActive ? '' : 'text-muted-foreground'">
          {{ pass.visitorName }}
        </p>
        <Badge v-if="isActive && pass.expiresToday" variant="secondary" class="shrink-0 text-xs">
          Vence hoy
        </Badge>
        <Badge :variant="STATUS[pass.status].variant" class="shrink-0 text-xs">
          {{ STATUS[pass.status].label }}
        </Badge>
      </div>

      <p class="mt-1 text-sm tabular-nums" :class="isActive && pass.expiresToday ? 'font-medium text-foreground' : 'text-muted-foreground'">
        {{ validityText }}
      </p>

      <p class="mt-0.5 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
        <span v-if="pass.visitorDocument">Cédula {{ pass.visitorDocument }}</span>
        <span>{{ pass.visitorType === 'invitado' ? 'Invitado' : 'Proveedor' }}</span>
        <span>{{ pass.multiUse ? 'Varias entradas' : 'Una entrada' }}</span>
      </p>

      <p v-if="showLastAccess && pass.lastAccessAt" class="mt-0.5 text-sm tabular-nums text-muted-foreground">
        Último acceso: {{ formatDateTime(pass.lastAccessAt) }}
      </p>

      <!-- Acciones (solo pases activos) -->
      <div v-if="isActive" class="mt-3 grid auto-cols-fr grid-flow-col gap-2 border-t pt-3 sm:flex">
        <Button
          variant="outline"
          class="h-11 px-2 sm:h-9 sm:px-3"
          :aria-expanded="isQrOpen"
          :aria-controls="qrPanelId"
          @click="toggleQr"
        >
          <QrCode class="size-4" />
          {{ isQrOpen ? 'Ocultar' : 'Ver QR' }}
        </Button>
        <Button
          v-if="pass.canEdit"
          as-child
          variant="outline"
          class="h-11 px-2 sm:h-9 sm:px-3"
        >
          <NuxtLink :to="editTo">
            <Pencil class="size-4" />
            Editar
          </NuxtLink>
        </Button>
        <Button
          v-if="pass.canCancel"
          variant="ghost"
          class="h-11 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive sm:h-9 sm:px-3"
          :disabled="isCanceling"
          @click="showCancelDialog = true"
        >
          <Ban class="size-4" />
          Cancelar
        </Button>
      </div>

      <div
        v-if="isActive && isQrOpen"
        :id="qrPanelId"
        class="mt-3 flex flex-col items-center gap-3"
      >
        <Loader2 v-if="!qrUrl" class="size-8 animate-spin text-muted-foreground" />
        <img
          v-else
          :src="qrUrl"
          :alt="`Código QR del pase de ${pass.visitorName}`"
          class="size-48 rounded-lg"
        >
        <Button variant="outline" class="h-11 sm:h-9" @click="handleShare">
          <Share2 class="size-4" />
          Compartir con el visitante
        </Button>
      </div>
    </CardContent>

    <VisitCancelDialog
      v-model:open="showCancelDialog"
      :visitor-name="pass.visitorName"
      :is-canceling="isCanceling"
      @confirm="emit('cancel', pass.id)"
    />
  </Card>
</template>
