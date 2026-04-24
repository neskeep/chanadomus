<script setup lang="ts">
import { ChevronLeft, ChevronRight, FileText } from 'lucide-vue-next'

definePageMeta({ layout: 'default', title: 'Informes Financieros' })

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function openReport(filePath: string): void {
  window.open(`/api/finance/reports/${filePath}`, '_blank')
}
</script>

<template>
  <div class="mx-auto max-w-lg">
    <!-- Error alert -->
    <div
      v-if="error"
      role="alert"
      class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <!-- Loading skeletons -->
    <div v-if="isLoading" class="space-y-3">
      <Card v-for="i in 3" :key="i">
        <CardContent class="p-4">
          <div class="space-y-3">
            <Skeleton class="h-4 w-3/4" />
            <Skeleton class="h-5 w-24 rounded-full" />
            <Skeleton class="h-8 w-32" />
            <Skeleton class="h-3 w-28" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Content -->
    <template v-else-if="!error">
      <!-- Empty state -->
      <div
        v-if="reports.length === 0"
        class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"
      >
        <div class="flex size-12 items-center justify-center rounded-full bg-muted">
          <FileText class="size-6 text-muted-foreground" />
        </div>
        <div>
          <p class="font-medium">No hay informes publicados</p>
          <p class="mt-1 text-sm text-muted-foreground">Los informes financieros aparecerán aquí</p>
        </div>
      </div>

      <!-- Report cards -->
      <div v-else class="space-y-3">
        <Card v-for="report in reports" :key="report.id">
          <CardContent class="p-4">
            <p class="text-sm font-medium">{{ report.title }}</p>
            <Badge class="mt-2">{{ formatMonth(report.month, report.year) }}</Badge>
            <div class="mt-3">
              <Button
                variant="outline"
                aria-label="Descargar PDF"
                @click="openReport(report.filePath)"
              >
                <FileText class="mr-1.5 size-4" />
                Descargar PDF
              </Button>
            </div>
            <p class="mt-2 text-xs text-muted-foreground">
              Publicado el {{ formatDate(report.createdAt) }}
            </p>
          </CardContent>
        </Card>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            :disabled="currentPage <= 1"
            aria-label="Página anterior"
            @click="currentPage--"
          >
            <ChevronLeft class="mr-1 size-4" />
            Anterior
          </Button>
          <span class="text-sm text-muted-foreground">
            Página {{ currentPage }} de {{ totalPages }}
          </span>
          <Button
            variant="outline"
            :disabled="currentPage >= totalPages"
            aria-label="Página siguiente"
            @click="currentPage++"
          >
            Siguiente
            <ChevronRight class="ml-1 size-4" />
          </Button>
        </div>
      </div>
    </template>
  </div>
</template>
