<script setup lang="ts">
import { Share2, Plus, ChevronDown, ChevronUp, User, Loader2 } from 'lucide-vue-next'
import type { QrStatus } from '~~/shared/types/qr'
import QRCode from 'qrcode'

useHead({ title: 'Visitas del Rancho' })

const { target, isMounted } = useTopbarPortal()
const { myCodes, fetchMyCodes, isLoading, error } = useQr()
const { formatDateTime } = useFormatDate()

// --- QR codes state ---
const activeFilter = ref<QrStatus | ''>('')
const expandedId = ref<string | null>(null)
const expandedQrUrl = ref<string | null>(null)
const shareSuccess = ref<string | null>(null)

const filterOptions: Array<{ value: QrStatus; label: string }> = [
  { value: 'active', label: 'Activos' },
  { value: 'used', label: 'Usados' },
  { value: 'expired', label: 'Expirados' },
]

onMounted(() => {
  fetchMyCodes('all')
})

watch(activeFilter, (status) => {
  expandedId.value = null
  expandedQrUrl.value = null
  fetchMyCodes(status || 'all')
})

async function toggleExpand(id: string, token: string) {
  if (expandedId.value === id) {
    expandedId.value = null
    expandedQrUrl.value = null
    return
  }

  expandedId.value = id
  const accessUrl = `${window.location.origin}/acceso/${token}`
  expandedQrUrl.value = await QRCode.toDataURL(accessUrl, { width: 200, margin: 2 })
}

async function handleShare(token: string) {
  const accessUrl = `${window.location.origin}/acceso/${token}`
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
    shareSuccess.value = 'Enlace copiado al portapapeles'
    setTimeout(() => { shareSuccess.value = null }, 3000)
  }
  catch {
    shareSuccess.value = 'No se pudo copiar el enlace'
    setTimeout(() => { shareSuccess.value = null }, 3000)
  }
}

const statusConfig: Record<QrStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  active: { label: 'Activo', variant: 'default' },
  used: { label: 'Usado', variant: 'secondary' },
  expired: { label: 'Expirado', variant: 'outline' },
}
</script>

<template>
  <div>
    <!-- Topbar actions (desktop) -->
    <Teleport :to="target" defer v-if="isMounted">
      <TopbarFilters :active="activeFilter !== ''" @clear="activeFilter = ''">
        <TopbarFilterGroup v-model="activeFilter" label="Estado" :options="filterOptions" />
      </TopbarFilters>
      <Button size="sm" @click="navigateTo('/conserje/nueva-visita')">
        <Plus class="mr-1.5 size-3.5" />
        Nueva
      </Button>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" @click="navigateTo('/conserje/nueva-visita')">
        <Plus class="size-4" />
      </Button>
    </TopbarMobileAction>

    <!-- Error alert -->
    <ErrorAlert :message="error" class="mb-4" />

    <!-- Share success -->
    <div
      v-if="shareSuccess"
      role="status"
      class="mb-4 rounded-lg border border-primary/50 bg-primary/10 p-3 text-center text-sm text-primary"
    >
      {{ shareSuccess }}
    </div>

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="3" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="myCodes.length === 0"
      :icon="User"
      title="Sin visitas registradas"
      description="Crea un pase de acceso para un visitante del rancho"
    >
      <template #action>
        <Button @click="navigateTo('/conserje/nueva-visita')">
          <Plus class="mr-1.5 size-4" />
          Nueva Visita
        </Button>
      </template>
    </EmptyState>

    <!-- Visits list -->
    <div v-else class="space-y-2">
      <Card
        v-for="code in myCodes"
        :key="code.id"
        class="cursor-pointer transition-shadow hover:shadow-sm"
        :class="code.status !== 'active' && 'opacity-75'"
        @click="code.status === 'active' ? toggleExpand(code.id, code.token) : undefined"
      >
        <CardContent class="px-3 py-2.5">
          <div class="flex items-center gap-2">
            <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ code.visitorName }}</p>
            <Badge :variant="statusConfig[code.status].variant" class="shrink-0 text-[11px]">
              {{ statusConfig[code.status].label }}
            </Badge>
            <Badge variant="outline" class="shrink-0 text-[11px]">
              {{ code.visitorType === 'invitado' ? 'Invitado' : 'Proveedor' }}
            </Badge>
            <component
              :is="expandedId === code.id ? ChevronUp : ChevronDown"
              v-if="code.status === 'active'"
              class="size-4 shrink-0 text-muted-foreground"
            />
          </div>

          <div class="mt-1 flex items-center gap-x-1 text-[11px] text-muted-foreground">
            <span class="truncate">{{ code.unitLabel || code.unitNumber }}</span>
            <span class="opacity-30">&middot;</span>
            <span class="shrink-0 tabular-nums">{{ code.usedAt ? formatDateTime(code.usedAt) : formatDateTime(code.expiresAt) }}</span>
          </div>

          <div
            v-if="expandedId === code.id && code.status === 'active'"
            class="mt-3 flex flex-col items-center gap-3 border-t pt-3"
          >
            <Loader2 v-if="!expandedQrUrl" class="size-8 animate-spin text-muted-foreground" />
            <img
              v-else
              :src="expandedQrUrl"
              alt="Codigo QR de acceso"
              class="size-48 rounded-lg"
            />
            <Button variant="outline" @click.stop="handleShare(code.token)">
              <Share2 class="size-4" />
              Compartir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
