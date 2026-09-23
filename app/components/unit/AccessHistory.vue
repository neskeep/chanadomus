<script setup lang="ts">
import { CalendarCheck, QrCode, Ticket, UserPlus, Wifi } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { EntryType, UnitAccessRange } from '~~/shared/types/access'
import { UNIT_ACCESS_RANGES } from '~~/shared/lib/access-history-range'

/**
 * Accesos registrados a una vivienda (propietario o conserje) con selector de
 * rango Hoy / 7 días / 30 días y "Cargar más". Datos de useUnitAccessHistory.
 */
interface Props {
  /** Cómo se nombra la vivienda en los textos: "tu vivienda", "la vivienda" */
  subject?: string
}

const props = withDefaults(defineProps<Props>(), { subject: 'tu vivienda' })

const {
  events,
  range,
  meta,
  total,
  hasMore,
  isLoading,
  isLoadingMore,
  error,
  fetchHistory,
  loadMore,
} = useUnitAccessHistory()
const { formatDate, formatDateTime, formatTime } = useFormatDate()

const RANGE_LABEL: Record<UnitAccessRange, string> = {
  today: 'Hoy',
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
}

const ENTRY_TYPE: Record<EntryType, { label: string; icon: Component }> = {
  qr: { label: 'Pase QR', icon: QrCode },
  manual: { label: 'Registro manual', icon: UserPlus },
  webhook: { label: 'Dispositivo', icon: Wifi },
  evento: { label: 'Evento', icon: Ticket },
}

onMounted(() => fetchHistory(range.value))

function onRangeChange(value: string | number) {
  const next = UNIT_ACCESS_RANGES.find(r => r === value)
  if (next && next !== range.value) fetchHistory(next)
}

const countText = computed(() => (total.value === 1 ? '1 acceso' : `${total.value} accesos`))

/** Resumen honesto del rango consultado y su total. */
const summary = computed(() => {
  const m = meta.value
  if (!m || isLoading.value) return null
  if (m.range === 'today') return `Hoy, ${formatDate(m.to)}: ${countText.value}`
  return `Del ${formatDate(m.from)} al ${formatDate(m.to)}: ${countText.value}`
})

const emptyText = computed(() => {
  if (range.value === 'today') return `Hoy no se ha registrado ningún acceso a ${props.subject}.`
  const days = range.value === '7d' ? '7' : '30'
  return `No hay accesos registrados a ${props.subject} en los últimos ${days} días.`
})

/** Hoy basta la hora; en rangos largos hace falta la fecha. */
function when(iso: string): string {
  return range.value === 'today' ? formatTime(iso) : formatDateTime(iso)
}
</script>

<template>
  <section aria-labelledby="unit-access-heading">
    <div class="mb-3 space-y-1">
      <h2 id="unit-access-heading" class="text-lg font-semibold">
        Accesos registrados a {{ subject }}
      </h2>
      <p class="min-h-5 text-sm tabular-nums text-muted-foreground" aria-live="polite">
        {{ summary }}
      </p>
    </div>

    <Tabs :model-value="range" @update:model-value="onRangeChange">
      <TabsList class="w-full group-data-horizontal/tabs:h-12 sm:w-fit" aria-label="Periodo">
        <TabsTrigger
          v-for="r in UNIT_ACCESS_RANGES"
          :key="r"
          :value="r"
          class="px-2 text-sm sm:px-4 md:text-base"
        >
          {{ RANGE_LABEL[r] }}
        </TabsTrigger>
      </TabsList>

      <TabsContent :value="range" class="mt-2">
        <ErrorAlert :message="error" class="mb-4" />

        <ListSkeleton v-if="isLoading" :count="3" variant="row" />

        <EmptyState
          v-else-if="events.length === 0 && !error"
          :icon="CalendarCheck"
          :title="emptyText"
        />

        <template v-else>
          <ul class="space-y-2">
            <li v-for="entry in events" :key="entry.id">
              <Card>
                <CardContent class="px-4 py-3">
                  <div class="flex items-start gap-2">
                    <p class="min-w-0 flex-1 break-words text-base font-semibold">
                      {{ entry.visitorName || 'Visitante sin nombre' }}
                    </p>
                    <Badge variant="outline" class="shrink-0 gap-1 text-xs">
                      <component :is="ENTRY_TYPE[entry.entryType]?.icon ?? QrCode" class="size-3" aria-hidden="true" />
                      {{ ENTRY_TYPE[entry.entryType]?.label ?? entry.entryType }}
                    </Badge>
                  </div>
                  <p class="mt-1 flex flex-wrap gap-x-3 text-sm tabular-nums text-muted-foreground">
                    <span v-if="entry.visitorDocument">Cédula {{ entry.visitorDocument }}</span>
                    <span>Entró {{ when(entry.createdAt) }}</span>
                    <span v-if="entry.exitAt">Salió {{ when(entry.exitAt) }}</span>
                    <span v-else class="font-medium text-foreground">Todavía dentro</span>
                  </p>
                </CardContent>
              </Card>
            </li>
          </ul>

          <ListLoadMore
            :shown="events.length"
            :total="total"
            :has-more="hasMore"
            :is-loading="isLoadingMore"
            noun="accesos"
            @load="loadMore"
          />
        </template>
      </TabsContent>
    </Tabs>
  </section>
</template>
