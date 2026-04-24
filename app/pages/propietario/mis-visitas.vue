<script setup lang="ts">
import { Share2, Plus, ChevronDown, ChevronUp, CalendarClock, User, Loader2 } from 'lucide-vue-next'
import type { QrStatus } from '~~/shared/types/qr'
import QRCode from 'qrcode'

definePageMeta({ layout: 'default', title: 'Mis Visitas' })

const { myCodes, fetchMyCodes, isLoading, error } = useQr()

const activeFilter = ref<QrStatus | 'all'>('all')
const expandedId = ref<string | null>(null)
const expandedQrUrl = ref<string | null>(null)
const shareSuccess = ref<string | null>(null)

const filters: { label: string; value: QrStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Activos', value: 'active' },
  { label: 'Usados', value: 'used' },
  { label: 'Expirados', value: 'expired' },
]

onMounted(() => {
  fetchMyCodes('all')
})

async function handleFilterChange(status: QrStatus | 'all') {
  activeFilter.value = status
  expandedId.value = null
  expandedQrUrl.value = null
  await fetchMyCodes(status)
}

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-VE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const statusConfig: Record<QrStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  active: { label: 'Activo', variant: 'default' },
  used: { label: 'Usado', variant: 'secondary' },
  expired: { label: 'Expirado', variant: 'outline' },
}
</script>

<template>
  <div class="mx-auto max-w-lg">
    <!-- Header -->
    <div class="mb-6 flex justify-end">
      <Button size="sm" as-child>
        <NuxtLink to="/propietario/nueva-visita">
          <Plus class="size-4" />
          Nueva Visita
        </NuxtLink>
      </Button>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="filter in filters"
        :key="filter.value"
        class="shrink-0 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="activeFilter === filter.value
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:bg-muted'"
        @click="handleFilterChange(filter.value)"
      >
        {{ filter.label }}
      </button>
    </div>

    <!-- Error alert -->
    <div
      v-if="error"
      role="alert"
      class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <!-- Share success -->
    <div
      v-if="shareSuccess"
      role="status"
      class="mb-4 rounded-lg border border-primary/50 bg-primary/10 p-3 text-center text-sm text-primary"
    >
      {{ shareSuccess }}
    </div>

    <!-- Loading skeletons -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="animate-pulse rounded-lg border p-4">
        <div class="flex items-center justify-between">
          <div class="space-y-2">
            <div class="h-4 w-32 rounded bg-muted" />
            <div class="h-3 w-24 rounded bg-muted" />
          </div>
          <div class="h-5 w-14 rounded-full bg-muted" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="myCodes.length === 0"
      class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"
    >
      <div class="flex size-12 items-center justify-center rounded-full bg-muted">
        <User class="size-6 text-muted-foreground" />
      </div>
      <div>
        <p class="font-medium">Aún no has registrado visitas</p>
        <p class="mt-1 text-sm text-muted-foreground">Crea un pase de acceso para tu primer visitante</p>
      </div>
      <Button as-child>
        <NuxtLink to="/propietario/nueva-visita">
          <Plus class="size-4" />
          Nueva Visita
        </NuxtLink>
      </Button>
    </div>

    <!-- Codes list -->
    <div v-else class="space-y-3">
      <Card
        v-for="code in myCodes"
        :key="code.id"
        class="cursor-pointer transition-shadow hover:shadow-sm"
        :class="code.status === 'active' ? '' : 'opacity-75'"
        @click="code.status === 'active' ? toggleExpand(code.id, code.token) : undefined"
      >
        <CardContent class="p-4">
          <!-- Main row -->
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium">{{ code.visitorName }}</p>
              <div class="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge :variant="statusConfig[code.status].variant">
                  {{ statusConfig[code.status].label }}
                </Badge>
                <Badge variant="outline">
                  {{ code.visitorType === 'invitado' ? 'Invitado' : 'Proveedor' }}
                </Badge>
              </div>
            </div>
            <component
              :is="expandedId === code.id ? ChevronUp : ChevronDown"
              v-if="code.status === 'active'"
              class="mt-1 size-4 shrink-0 text-muted-foreground"
            />
          </div>

          <!-- Details -->
          <div class="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span>{{ code.unitNumber }}{{ code.unitLabel ? ` — ${code.unitLabel}` : '' }}</span>
            <span class="flex items-center gap-1">
              <CalendarClock class="size-3" />
              {{ code.usedAt ? formatDate(code.usedAt) : formatDate(code.expiresAt) }}
            </span>
          </div>

          <!-- Expanded QR (active codes only) -->
          <div
            v-if="expandedId === code.id && code.status === 'active'"
            class="mt-4 flex flex-col items-center gap-3 border-t pt-4"
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
