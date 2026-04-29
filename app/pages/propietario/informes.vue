<script setup lang="ts">
import { Download, FileText } from 'lucide-vue-next'

useHead({ title: 'Informes Financieros' })

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const { reports, meta, isLoading, error, totalPages, fetchReports } = useFinancialReports()

const currentPage = ref(1)

watch(currentPage, (page) => {
  fetchReports(page)
})

onMounted(() => {
  fetchReports()
})

function formatMonth(month: number, year: number): string {
  return `${MONTHS[month - 1]} ${year}`
}

const { formatDate } = useFormatDate()

function openReport(filePath: string): void {
  window.open(`/api/finance/reports/${filePath}`, '_blank')
}
</script>

<template>
  <div>
    <ErrorAlert :message="error" class="mb-4" />

    <ListSkeleton v-if="isLoading" :count="3" />

    <template v-else-if="!error">
      <EmptyState
        v-if="reports.length === 0"
        :icon="FileText"
        title="No hay informes publicados"
        description="Los informes financieros aparecerán aquí"
      />

      <div v-else class="space-y-2">
        <Card
          v-for="report in reports"
          :key="report.id"
          class="cursor-pointer hover:bg-muted/50"
          @click="openReport(report.filePath)"
        >
          <CardContent class="px-3 py-2.5">
            <div class="flex items-center gap-2">
              <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ report.title }}</p>
              <Badge variant="secondary" class="shrink-0 text-[11px]">{{ formatMonth(report.month, report.year) }}</Badge>
            </div>
            <div class="mt-1 flex items-center gap-2">
              <span class="text-[11px] text-muted-foreground tabular-nums">Publicado el {{ formatDate(report.createdAt) }}</span>
              <span class="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                class="h-6 px-2 text-[11px]"
                aria-label="Descargar PDF"
                @click.stop="openReport(report.filePath)"
              >
                <Download class="mr-1 size-3" />
                Descargar PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <ListPagination
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          class="mt-4"
        />
      </div>
    </template>
  </div>
</template>
