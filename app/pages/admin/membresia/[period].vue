<script setup lang="ts">
import { CalendarX, Download, RefreshCw } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const route = useRoute()
const period = computed(() => String(route.params.period ?? ''))

const { formatMonthYear, formatDateTime, formatCurrency } = useFormatDate()
const { isSuperAdmin } = useAuth()
const monthName = computed(() => (/^\d{4}-\d{2}$/.test(period.value) ? formatMonthYear(`${period.value}-01`) : period.value))

useHead({ title: () => `Cierre de ${monthName.value.toLowerCase()}` })

const { detail, isLoading, hasFetched, isClosing, error, notFound, fetchDetail, closePeriod } = useMembershipClosings()

// Se fija al llegar los datos (como en los demás detalles): al navegar, usePageInfo limpia el override.
usePageInfoOverride(computed(() => (detail.value ? { title: `Cierre de ${monthName.value.toLowerCase()}` } : null)))

const closing = computed(() => detail.value?.closing ?? null)
const rows = computed(() => (detail.value?.units ?? []).map(membershipRowFromClosingUnit))

const closedBy = computed(() => {
  const c = closing.value
  if (!c) return ''
  if (c.isAutomatic) return 'Cierre automático'
  return c.closedByName ? `Cerrado por ${c.closedByName}` : 'Cierre manual'
})

const isRegenerateOpen = ref(false)

async function onRegenerate(value: string) {
  try {
    await closePeriod(value)
    isRegenerateOpen.value = false
    toast.success(`Cierre de ${monthName.value.toLowerCase()} regenerado`)
    await fetchDetail(period.value)
  }
  catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'No se pudo regenerar el cierre')
  }
}

onMounted(() => fetchDetail(period.value))
</script>

<template>
  <div class="space-y-6">
    <ErrorAlert :message="error" />

    <EmptyState
      v-if="notFound"
      :icon="CalendarX"
      :title="`${monthName} todavía no tiene cierre`"
      description="Los meses se cierran solos el día 1 del mes siguiente."
    >
      <template #action>
        <Button variant="outline" as-child>
          <NuxtLink to="/admin/membresia?tab=cierres">Ver cierres</NuxtLink>
        </Button>
      </template>
    </EmptyState>

    <template v-else-if="!error">
      <!-- Datos del cierre y acciones -->
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div v-if="closing" class="space-y-0.5">
          <p class="text-sm text-muted-foreground">
            {{ closedBy }}, el {{ formatDateTime(closing.closedAt) }}
          </p>
          <p class="text-sm text-muted-foreground">
            Tarifas aplicadas: <span class="font-medium tabular-nums text-foreground">{{ formatCurrency(closing.fullRate) }}</span> completa
            y <span class="font-medium tabular-nums text-foreground">{{ formatCurrency(closing.reducedRate) }}</span> reducida, en {{ closing.currency }}
          </p>
        </div>
        <div v-else class="space-y-1.5">
          <Skeleton class="h-4 w-64" />
          <Skeleton class="h-4 w-80" />
        </div>

        <div class="flex flex-wrap gap-2">
          <Button variant="outline" class="h-11 md:h-9" :disabled="!closing" @click="openMembershipExport(period)">
            <Download class="size-4" aria-hidden="true" />
            Exportar CSV
          </Button>
          <Button v-if="isSuperAdmin" variant="outline" class="h-11 md:h-9" :disabled="!closing" @click="isRegenerateOpen = true">
            <RefreshCw class="size-4" aria-hidden="true" />
            Regenerar cierre
          </Button>
        </div>
      </div>

      <MembershipTotals
        :totals="detail?.totals ?? null"
        :rates="closing"
        total-label="Total del cierre"
        :is-loading="!hasFetched || (isLoading && !detail)"
      />

      <section class="space-y-4" aria-labelledby="closing-units-title">
        <h2 id="closing-units-title" class="text-base font-semibold">
          Unidades
          <span v-if="detail" class="font-normal tabular-nums text-muted-foreground">{{ rows.length }}</span>
        </h2>
        <ListSkeleton v-if="!hasFetched || (isLoading && !detail)" :count="6" variant="row" />
        <MembershipUnitsTable v-else :rows="rows" :class="isLoading && 'opacity-60'" />
      </section>
    </template>

    <MembershipClosePeriodDialog
      v-if="isSuperAdmin"
      v-model:open="isRegenerateOpen"
      :periods="[period]"
      :closed-periods="[period]"
      :is-closing="isClosing"
      @confirm="onRegenerate"
    />
  </div>
</template>
