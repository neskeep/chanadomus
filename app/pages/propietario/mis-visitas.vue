<script setup lang="ts">
import { Plus, User, QrCode, UserPlus, Wifi } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { QrStatus } from '~~/shared/types/qr'
import type { AccessEvent } from '~~/shared/types/access'

useHead({ title: 'Mis Visitas' })

const { target, isMounted } = useTopbarPortal()
const { myCodes, fetchMyCodes, cancelQr, isCanceling, isLoading, error } = useQr()
const { formatDateTime } = useFormatDate()

// --- Access history for this unit ---
const accessHistory = ref<AccessEvent[]>([])
const isLoadingHistory = ref(false)

async function fetchAccessHistory() {
  isLoadingHistory.value = true
  try {
    const result = await $fetch<{ data: AccessEvent[] }>('/api/my-unit/access-history')
    accessHistory.value = result.data
  }
  catch {
    // Silent — supplementary data
  }
  finally {
    isLoadingHistory.value = false
  }
}

const ENTRY_TYPE_LABEL: Record<string, { label: string; icon: typeof QrCode }> = {
  qr: { label: 'QR', icon: QrCode },
  manual: { label: 'Manual', icon: UserPlus },
  webhook: { label: 'Dispositivo', icon: Wifi },
}

// --- QR codes state ---
// Al entrar solo se muestran pases vigentes; el resto queda tras el filtro.
// El TopbarFilterGroup usa '' al deseleccionar; lo tratamos como "activos".
const activeFilter = ref<QrStatus | ''>('active')
const resolvedFilter = computed<QrStatus>(() => activeFilter.value || 'active')

const filterOptions: Array<{ value: QrStatus; label: string }> = [
  { value: 'active', label: 'Activos' },
  { value: 'used', label: 'Usados' },
  { value: 'expired', label: 'Expirados' },
  { value: 'canceled', label: 'Cancelados' },
]

onMounted(() => {
  fetchMyCodes(resolvedFilter.value)
  fetchAccessHistory()
})

watch(resolvedFilter, (status) => {
  fetchMyCodes(status)
})

async function handleCancel(id: string) {
  try {
    await cancelQr(id)
    toast.success('Pase cancelado')
  }
  catch {
    toast.error(error.value ?? 'No se pudo cancelar el pase')
  }
}

const EMPTY_STATE: Record<QrStatus, { title: string; description: string }> = {
  active: { title: 'Sin pases activos', description: 'Crea un pase de acceso para tu próximo visitante' },
  used: { title: 'Sin pases usados', description: 'Aquí verás los pases que ya fueron escaneados' },
  expired: { title: 'Sin pases expirados', description: 'Aquí verás los pases que vencieron sin usarse' },
  canceled: { title: 'Sin pases cancelados', description: 'Aquí verás los pases que hayas cancelado' },
}
const emptyState = computed(() => EMPTY_STATE[resolvedFilter.value])
</script>

<template>
  <div>
    <!-- Topbar actions (desktop) -->
    <Teleport v-if="isMounted" :to="target" defer>
      <TopbarFilters :active="resolvedFilter !== 'active'" @clear="activeFilter = 'active'">
        <TopbarFilterGroup v-model="activeFilter" label="Estado" :options="filterOptions" />
      </TopbarFilters>
      <Button size="sm" @click="navigateTo('/propietario/nueva-visita')">
        <Plus class="mr-1.5 size-3.5" />
        Nueva
      </Button>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" @click="navigateTo('/propietario/nueva-visita')">
        <Plus class="size-4" />
      </Button>
    </TopbarMobileAction>

    <!-- Error alert -->
    <ErrorAlert :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="3" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="myCodes.length === 0"
      :icon="User"
      :title="emptyState.title"
      :description="emptyState.description"
    >
      <template v-if="resolvedFilter === 'active'" #action>
        <Button @click="navigateTo('/propietario/nueva-visita')">
          <Plus class="mr-1.5 size-4" />
          Nueva Visita
        </Button>
      </template>
    </EmptyState>

    <!-- Visits list -->
    <div v-else class="space-y-2">
      <VisitPassCard
        v-for="code in myCodes"
        :key="code.id"
        :pass="code"
        :is-canceling="isCanceling"
        @cancel="handleCancel"
      />
    </div>

    <!-- Access history for this unit -->
    <div class="mt-6">
      <h2 class="mb-3 text-sm font-semibold text-muted-foreground">Accesos registrados a tu vivienda</h2>

      <ListSkeleton v-if="isLoadingHistory" :count="3" />

      <p
        v-else-if="accessHistory.length === 0"
        class="py-4 text-center text-sm text-muted-foreground"
      >
        Sin registros de acceso en los últimos 30 días
      </p>

      <div v-else class="space-y-2">
        <Card v-for="entry in accessHistory" :key="entry.id">
          <CardContent class="px-3 py-2.5">
            <div class="flex items-center gap-1.5">
              <p class="min-w-0 flex-1 truncate text-sm font-semibold">
                {{ entry.visitorName || 'Visitante' }}
              </p>
              <Badge variant="secondary" class="shrink-0 gap-1 text-[11px]">
                <component :is="ENTRY_TYPE_LABEL[entry.entryType]?.icon ?? QrCode" class="size-3" />
                {{ ENTRY_TYPE_LABEL[entry.entryType]?.label ?? entry.entryType }}
              </Badge>
            </div>
            <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
              <template v-if="entry.visitorDocument">
                <span class="truncate">{{ entry.visitorDocument }}</span>
                <span class="opacity-30">&middot;</span>
              </template>
              <span class="shrink-0 tabular-nums">{{ formatDateTime(entry.createdAt) }}</span>
              <template v-if="entry.exitAt">
                <span class="opacity-30">&rarr;</span>
                <span class="shrink-0 tabular-nums">{{ formatDateTime(entry.exitAt) }}</span>
              </template>
              <template v-else>
                <span class="opacity-30">&middot;</span>
                <span class="text-primary">En sitio</span>
              </template>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
