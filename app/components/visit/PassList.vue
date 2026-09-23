<script setup lang="ts">
import { Plus, User } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { QrPassItem, QrStatus } from '~~/shared/types/qr'

/**
 * Lista de pases de "Mis Visitas" (propietario y conserje): filtro por estado,
 * pases que vencen hoy primero, acciones por pase y "Cargar más".
 */
interface Props {
  /** Raíz de las rutas del rol: '/propietario' o '/conserje' */
  basePath: string
  emptyActiveDescription?: string
  emptyCanceledDescription?: string
}

const props = withDefaults(defineProps<Props>(), {
  emptyActiveDescription: 'Crea un pase para tu próximo visitante.',
  emptyCanceledDescription: 'Aquí verás los pases que se hayan cancelado.',
})

const { target, isMounted } = useTopbarPortal()
const {
  myCodes,
  meta,
  hasMoreCodes,
  isLoading,
  isLoadingMore,
  isCanceling,
  error,
  fetchMyCodes,
  loadMoreCodes,
  cancelQr,
} = useQr()

const newPassPath = computed(() => `${props.basePath}/nueva-visita`)
const editPath = (id: string) => `${props.basePath}/mis-visitas/${id}/editar`

const STATUS_TABS: Array<{ value: QrStatus; label: string }> = [
  { value: 'active', label: 'Activos' },
  { value: 'used', label: 'Usados' },
  { value: 'expired', label: 'Expirados' },
  { value: 'canceled', label: 'Cancelados' },
]

// Al entrar solo se ven los pases vigentes; el resto queda en las otras pestañas
const status = ref<QrStatus>('active')

function onStatusChange(value: string | number) {
  const next = STATUS_TABS.find(t => t.value === value)?.value
  if (next) status.value = next
}

onMounted(() => fetchMyCodes(status.value))
watch(status, s => fetchMyCodes(s))

/** Activos: primero los que vencen hoy (el servidor ya los ordena así). */
const groups = computed<Array<{ key: string; title: string | null; items: QrPassItem[] }>>(() => {
  if (status.value !== 'active') return [{ key: 'all', title: null, items: myCodes.value }]
  const today = myCodes.value.filter(c => c.expiresToday)
  const later = myCodes.value.filter(c => !c.expiresToday)
  if (today.length === 0) return [{ key: 'all', title: null, items: later }]
  return [
    { key: 'today', title: 'Vencen hoy', items: today },
    { key: 'later', title: 'Vencen más adelante', items: later },
  ].filter(g => g.items.length > 0)
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

const EMPTY_STATE = computed<Record<QrStatus, { title: string; description: string }>>(() => ({
  active: { title: 'No hay pases activos', description: props.emptyActiveDescription },
  used: { title: 'No hay pases usados', description: 'Aquí verás los pases que ya se usaron para entrar.' },
  expired: { title: 'No hay pases expirados', description: 'Aquí verás los pases que vencieron sin usarse.' },
  canceled: { title: 'No hay pases cancelados', description: props.emptyCanceledDescription },
}))
const emptyState = computed(() => EMPTY_STATE.value[status.value])
</script>

<template>
  <section aria-labelledby="passes-heading">
    <!-- Acción principal en la barra superior (escritorio) -->
    <Teleport v-if="isMounted" :to="target" defer>
      <Button size="sm" as-child>
        <NuxtLink :to="newPassPath">
          <Plus class="size-3.5" />
          Nueva visita
        </NuxtLink>
      </Button>
    </Teleport>

    <h2 id="passes-heading" class="sr-only">Pases de visita</h2>

    <!-- Acción principal (móvil y tablet pequeña) -->
    <Button as-child class="mb-4 h-12 w-full text-base font-semibold md:hidden">
      <NuxtLink :to="newPassPath">
        <Plus class="size-4" />
        Nueva visita
      </NuxtLink>
    </Button>

    <Tabs :model-value="status" @update:model-value="onStatusChange">
      <TabsList class="w-full group-data-horizontal/tabs:h-12 sm:w-fit" aria-label="Estado de los pases">
        <TabsTrigger
          v-for="tab in STATUS_TABS"
          :key="tab.value"
          :value="tab.value"
          class="px-2 text-sm sm:px-4 md:text-base"
        >
          {{ tab.label }}
        </TabsTrigger>
      </TabsList>

      <TabsContent :value="status" class="mt-2">
        <ErrorAlert :message="error" class="mb-4" />

        <ListSkeleton v-if="isLoading" :count="3" />

        <EmptyState
          v-else-if="myCodes.length === 0"
          :icon="User"
          :title="emptyState.title"
          :description="emptyState.description"
        >
          <template v-if="status === 'active'" #action>
            <Button as-child class="h-11 md:h-9">
              <NuxtLink :to="newPassPath">
                <Plus class="size-4" />
                Nueva visita
              </NuxtLink>
            </Button>
          </template>
        </EmptyState>

        <template v-else>
          <div class="space-y-5">
            <div v-for="group in groups" :key="group.key">
              <h3 v-if="group.title" class="mb-2 text-base font-semibold">
                {{ group.title }}
                <span v-if="group.key === 'today'" class="font-normal tabular-nums text-muted-foreground">({{ group.items.length }})</span>
              </h3>
              <div class="space-y-2">
                <VisitPassCard
                  v-for="code in group.items"
                  :key="code.id"
                  :pass="code"
                  :edit-to="editPath(code.id)"
                  :is-canceling="isCanceling"
                  @cancel="handleCancel"
                />
              </div>
            </div>
          </div>

          <ListLoadMore
            :shown="myCodes.length"
            :total="meta.total"
            :has-more="hasMoreCodes"
            :is-loading="isLoadingMore"
            noun="pases"
            @load="loadMoreCodes"
          />
        </template>
      </TabsContent>
    </Tabs>
  </section>
</template>
