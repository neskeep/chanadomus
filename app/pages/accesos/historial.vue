<script setup lang="ts">
import { Shield, QrCode, UserPlus, Wifi, CalendarIcon, RotateCcw, FileDown, PartyPopper } from 'lucide-vue-next'
import type { DateValue } from 'reka-ui'
import type { AccessResult, EntryType } from '~~/shared/types/access'

definePageMeta({ layout: 'default' })
useHead({ title: 'Historial de Accesos' })

const { target, isMounted } = useTopbarPortal()
const {
  events,
  isLoading,
  error,
  filters,
  pagination,
  fetchHistory,
  goToPage,
  applyFilters,
  resetFilters,
} = useAccessHistory()
const { units: unitList, fetchUnits } = useUnits()

// --- Result & entry type configs ---

const RESULT_CONFIG: Record<AccessResult, { label: string; textClass: string; dotClass: string }> = {
  allowed: { label: 'Permitido', textClass: 'text-primary', dotClass: 'bg-primary' },
  denied: { label: 'Denegado', textClass: 'text-destructive', dotClass: 'bg-destructive' },
  expired: { label: 'Expirado', textClass: 'text-amber-600', dotClass: 'bg-amber-500' },
  already_used: { label: 'Ya usado', textClass: 'text-amber-600', dotClass: 'bg-amber-500' },
}

const ENTRY_TYPE_CONFIG: Record<EntryType, { label: string; icon: typeof QrCode }> = {
  qr: { label: 'QR', icon: QrCode },
  manual: { label: 'Manual', icon: UserPlus },
  webhook: { label: 'Dispositivo', icon: Wifi },
  evento: { label: 'Evento', icon: PartyPopper },
}

const resultOptions = [
  { value: 'allowed', label: 'Permitido' },
  { value: 'denied', label: 'Denegado' },
  { value: 'expired', label: 'Expirado' },
]

const entryTypeOptions = [
  { value: 'qr', label: 'QR' },
  { value: 'manual', label: 'Manual' },
  { value: 'webhook', label: 'Dispositivo' },
]

// --- Filter state ---

const filterResult = ref('')
const filterEntryType = ref('')
const filterUnitId = ref('')
const filterFrom = shallowRef<DateValue | undefined>()
const filterTo = shallowRef<DateValue | undefined>()
const fromPickerOpen = ref(false)
const toPickerOpen = ref(false)
const searchInput = ref('')

const hasActiveFilters = computed(() =>
  filterResult.value !== ''
  || filterEntryType.value !== ''
  || filterUnitId.value !== ''
  || filterFrom.value !== undefined
  || filterTo.value !== undefined,
)

const sortedUnits = computed(() =>
  [...unitList.value].sort((a, b) => (a.label ?? a.number).localeCompare(b.label ?? b.number, 'es')),
)

// --- Date helpers ---

function dateValueToISO(d: DateValue | undefined): string | undefined {
  if (!d) return undefined
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}

function formatPickerDate(d: DateValue): string {
  const date = new Date(d.year, d.month - 1, d.day)
  return date.toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) + ' ' + d.toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-VE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// --- Sync filters to composable ---

watch([filterResult, filterEntryType, filterUnitId], () => {
  filters.value.result = (filterResult.value as AccessResult | '') || ''
  filters.value.entryType = (filterEntryType.value as EntryType | '') || ''
  filters.value.unitId = filterUnitId.value
  applyFilters()
})

watch([filterFrom, filterTo], () => {
  const from = dateValueToISO(filterFrom.value)
  const to = dateValueToISO(filterTo.value)
  if (from) filters.value.from = from
  if (to) filters.value.to = to
  applyFilters()
})

// Debounced server-side search
let searchTimeout: ReturnType<typeof setTimeout> | undefined
watch(searchInput, (val) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filters.value.search = val
    applyFilters()
  }, 400)
})

function clearAllFilters() {
  filterResult.value = ''
  filterEntryType.value = ''
  filterUnitId.value = ''
  filterFrom.value = undefined
  filterTo.value = undefined
  searchInput.value = ''
  resetFilters()
}

// --- PDF export ---

async function generatePdf() {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ orientation: 'landscape' })

  doc.setFontSize(14)
  doc.text('Historial de Accesos', 14, 15)
  doc.setFontSize(9)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 21)
  doc.text(`Periodo: ${filters.value.from} — ${filters.value.to}`, 14, 26)

  autoTable(doc, {
    startY: 32,
    head: [['Fecha/Hora', 'Visitante', 'Cédula', 'Destino', 'Tipo', 'Resultado', 'Salida']],
    body: events.value.map(e => [
      formatDateTime(e.createdAt),
      e.visitorName || 'Visitante',
      e.visitorDocument || '—',
      e.unitLabel || e.unitNumber || e.notes || '—',
      ENTRY_TYPE_CONFIG[e.entryType].label,
      RESULT_CONFIG[e.result].label,
      e.exitAt ? formatTime(e.exitAt) : '—',
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [31, 41, 51] },
  })

  doc.save(`accesos-${filters.value.from}-${filters.value.to}.pdf`)
}

// --- Init ---

onMounted(() => {
  fetchHistory()
  fetchUnits()
})
</script>

<template>
  <div>
    <!-- Desktop topbar: Search + Filters + PDF action -->
    <Teleport v-if="isMounted" :to="target" defer>
      <TopbarSearch v-model="searchInput" placeholder="Buscar por nombre o cedula...">
        <TopbarFilters :active="hasActiveFilters" @clear="clearAllFilters">
          <TopbarFilterGroup v-model="filterResult" label="Resultado" :options="resultOptions" />
          <TopbarFilterGroup v-model="filterEntryType" label="Tipo de entrada" :options="entryTypeOptions" />
          <div>
            <p class="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Destino
            </p>
            <UnitCombobox
              :model-value="filterUnitId || undefined"
              :units="sortedUnits"
              placeholder="Todas las unidades"
              @update:model-value="(v: string | undefined) => { filterUnitId = v ?? '' }"
            />
          </div>
          <div>
            <p class="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Rango de fechas
            </p>
            <div class="space-y-1.5">
              <div>
                <Label class="text-[11px] text-muted-foreground">Desde</Label>
                <Popover v-model:open="fromPickerOpen">
                  <PopoverTrigger as-child>
                    <Button variant="outline" class="mt-0.5 h-7 w-full justify-start text-xs font-normal">
                      <CalendarIcon class="mr-1.5 size-3 shrink-0 text-muted-foreground" />
                      <span v-if="filterFrom" class="truncate">{{ formatPickerDate(filterFrom) }}</span>
                      <span v-else class="text-muted-foreground">Seleccionar</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0" align="start">
                    <Calendar
                      :model-value="filterFrom"
                      locale="es"
                      @update:model-value="(v: DateValue | undefined) => { filterFrom = v; fromPickerOpen = false }"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label class="text-[11px] text-muted-foreground">Hasta</Label>
                <Popover v-model:open="toPickerOpen">
                  <PopoverTrigger as-child>
                    <Button variant="outline" class="mt-0.5 h-7 w-full justify-start text-xs font-normal">
                      <CalendarIcon class="mr-1.5 size-3 shrink-0 text-muted-foreground" />
                      <span v-if="filterTo" class="truncate">{{ formatPickerDate(filterTo) }}</span>
                      <span v-else class="text-muted-foreground">Seleccionar</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0" align="start">
                    <Calendar
                      :model-value="filterTo"
                      locale="es"
                      @update:model-value="(v: DateValue | undefined) => { filterTo = v; toPickerOpen = false }"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </TopbarFilters>
      </TopbarSearch>
      <Button v-if="events.length > 0" variant="outline" size="sm" @click="generatePdf">
        <FileDown class="mr-1.5 size-3.5" />
        Exportar
      </Button>
    </Teleport>

    <!-- Mobile topbar action -->
    <TopbarMobileAction>
      <Button v-if="events.length > 0" size="icon" variant="ghost" class="size-9" @click="generatePdf">
        <FileDown class="size-4" />
      </Button>
    </TopbarMobileAction>

    <!-- Mobile search -->
    <div class="mb-4 md:hidden">
      <TopbarSearch v-model="searchInput" placeholder="Buscar por nombre o cedula...">
        <TopbarFilters :active="hasActiveFilters" @clear="clearAllFilters">
          <TopbarFilterGroup v-model="filterResult" label="Resultado" :options="resultOptions" />
          <TopbarFilterGroup v-model="filterEntryType" label="Tipo de entrada" :options="entryTypeOptions" />
          <div>
            <p class="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Destino
            </p>
            <UnitCombobox
              :model-value="filterUnitId || undefined"
              :units="sortedUnits"
              placeholder="Todas las unidades"
              @update:model-value="(v: string | undefined) => { filterUnitId = v ?? '' }"
            />
          </div>
          <div>
            <p class="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Rango de fechas
            </p>
            <div class="space-y-1.5">
              <div>
                <Label class="text-[11px] text-muted-foreground">Desde</Label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button variant="outline" class="mt-0.5 h-7 w-full justify-start text-xs font-normal">
                      <CalendarIcon class="mr-1.5 size-3 shrink-0 text-muted-foreground" />
                      <span v-if="filterFrom" class="truncate">{{ formatPickerDate(filterFrom) }}</span>
                      <span v-else class="text-muted-foreground">Seleccionar</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0" align="start">
                    <Calendar
                      :model-value="filterFrom"
                      locale="es"
                      @update:model-value="(v: DateValue | undefined) => { filterFrom = v }"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label class="text-[11px] text-muted-foreground">Hasta</Label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button variant="outline" class="mt-0.5 h-7 w-full justify-start text-xs font-normal">
                      <CalendarIcon class="mr-1.5 size-3 shrink-0 text-muted-foreground" />
                      <span v-if="filterTo" class="truncate">{{ formatPickerDate(filterTo) }}</span>
                      <span v-else class="text-muted-foreground">Seleccionar</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0" align="start">
                    <Calendar
                      :model-value="filterTo"
                      locale="es"
                      @update:model-value="(v: DateValue | undefined) => { filterTo = v }"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </TopbarFilters>
      </TopbarSearch>
    </div>

    <!-- Results count -->
    <div v-if="!isLoading && pagination.total > 0" class="mb-3 md:hidden">
      <Badge variant="secondary" class="tabular-nums">
        {{ pagination.total }} {{ pagination.total === 1 ? 'registro' : 'registros' }}
      </Badge>
    </div>

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="8" variant="row" />

    <!-- Error -->
    <ErrorAlert v-else-if="error" :message="error" />

    <!-- Empty -->
    <EmptyState
      v-else-if="events.length === 0"
      :icon="Shield"
      title="Sin registros"
      description="No se encontraron accesos para los filtros seleccionados"
    >
      <template v-if="hasActiveFilters || searchInput" #action>
        <Button variant="outline" size="sm" @click="clearAllFilters">
          <RotateCcw class="mr-1.5 size-4" />
          Limpiar filtros
        </Button>
      </template>
    </EmptyState>

    <!-- Results -->
    <template v-else>
      <!-- Desktop table -->
      <div class="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha/Hora</TableHead>
              <TableHead>Visitante</TableHead>
              <TableHead>Cedula</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>Salida</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="event in events" :key="event.id">
              <TableCell class="tabular-nums text-muted-foreground">
                {{ formatDateTime(event.createdAt) }}
              </TableCell>
              <TableCell class="font-medium">
                {{ event.visitorName || 'Visitante' }}
              </TableCell>
              <TableCell class="tabular-nums text-muted-foreground">
                {{ event.visitorDocument || '—' }}
              </TableCell>
              <TableCell>
                {{ event.unitLabel || event.unitNumber || event.notes || '—' }}
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1">
                  <component :is="ENTRY_TYPE_CONFIG[event.entryType].icon" class="size-3.5 text-muted-foreground" />
                  <span class="text-sm">{{ ENTRY_TYPE_CONFIG[event.entryType].label }}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  class="gap-1.5"
                  :class="RESULT_CONFIG[event.result].textClass"
                >
                  <span
                    class="size-1.5 rounded-lg"
                    :class="RESULT_CONFIG[event.result].dotClass"
                  />
                  {{ RESULT_CONFIG[event.result].label }}
                </Badge>
              </TableCell>
              <TableCell class="tabular-nums text-muted-foreground">
                {{ event.exitAt ? formatTime(event.exitAt) : '—' }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile cards -->
      <div class="space-y-2 md:hidden">
        <Card v-for="event in events" :key="event.id" class="min-w-0">
          <CardContent class="px-3 py-2.5">
            <!-- Row 1: Name + Unit + Time -->
            <div class="flex items-center gap-1.5">
              <p class="min-w-0 flex-1 truncate text-sm font-semibold">
                {{ event.visitorName || 'Visitante' }}
              </p>
              <Badge v-if="event.unitNumber" variant="secondary" class="shrink-0 text-[11px] font-semibold">
                {{ event.unitLabel || event.unitNumber }}
              </Badge>
              <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {{ formatTime(event.createdAt) }}
              </span>
            </div>

            <!-- Row 2: Result · Type · Document -->
            <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
              <span :class="RESULT_CONFIG[event.result].textClass" class="font-medium">
                {{ RESULT_CONFIG[event.result].label }}
              </span>
              <span class="opacity-30">&middot;</span>
              <component :is="ENTRY_TYPE_CONFIG[event.entryType].icon" class="size-3 shrink-0" />
              <span class="shrink-0">{{ ENTRY_TYPE_CONFIG[event.entryType].label }}</span>
              <template v-if="event.visitorDocument">
                <span class="opacity-30">&middot;</span>
                <span class="truncate">{{ event.visitorDocument }}</span>
              </template>
              <template v-if="event.exitAt">
                <span class="ml-auto shrink-0 tabular-nums">
                  &rarr; {{ formatTime(event.exitAt) }}
                </span>
              </template>
            </div>

            <!-- Row 3: Full date -->
            <p class="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
              {{ formatDateShort(event.createdAt) }}
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Pagination -->
      <ListPagination
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        class="mt-3"
        @update:current-page="goToPage"
      />
    </template>
  </div>
</template>
