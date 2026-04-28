<script setup lang="ts">
import {
  ArrowUpDown,
  Wallet,
  AlertTriangle,
  Building2,
  Upload,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { RecordType } from '~~/shared/types/financial'

useHead({ title: 'Panel Financiero' })

// --- Composables ---
const { summaries, isLoading, error, totalUnits, totalInDebt, fetchSummary } = useFinanceSummary()
const { isSubmitting, error: recordError, createRecord } = useFinanceRecords()
const {
  reports,
  meta: reportsMeta,
  isLoading: reportsLoading,
  isUploading,
  error: reportsError,
  totalPages,
  fetchReports,
  uploadReport,
} = useFinancialReports()
const { units, fetchUnits } = useUnits()

// --- Tab state ---
const activeTab = ref('resumen')

const { target, isMounted } = useTopbarPortal()

// --- Resumen: search & sort ---
const searchQuery = ref('')
const sortAsc = ref(true)

const filteredSummaries = computed(() => {
  let result = summaries.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(
      s => s.unitNumber.toLowerCase().includes(q)
        || (s.unitLabel?.toLowerCase().includes(q)),
    )
  }
  result = [...result].sort((a, b) => {
    const diff = parseFloat(a.balance) - parseFloat(b.balance)
    return sortAsc.value ? diff : -diff
  })
  return result
})

// --- Movimiento form ---
const formUnit = ref('')
const formType = ref<RecordType | ''>('')
const formAmount = ref('')
const formDescription = ref('')
const formDate = ref('')

async function handleCreateRecord() {
  if (!formUnit.value || !formType.value || !formAmount.value || !formDescription.value || !formDate.value) {
    toast.error('Completa todos los campos')
    return
  }
  try {
    await createRecord({
      unitId: formUnit.value,
      type: formType.value as RecordType,
      amount: formAmount.value,
      description: formDescription.value,
      date: formDate.value,
    })
    toast.success('Movimiento registrado correctamente')
    // Reset form
    formUnit.value = ''
    formType.value = ''
    formAmount.value = ''
    formDescription.value = ''
    formDate.value = new Date().toISOString().split('T')[0]
    // Switch to resumen and refetch
    activeTab.value = 'resumen'
    await fetchSummary()
  }
  catch {
    toast.error(recordError.value ?? 'Error al registrar movimiento')
  }
}

// --- Informes form ---
const reportTitle = ref('')
const reportMonth = ref('')
const reportYear = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

async function handleUploadReport() {
  const file = fileInputRef.value?.files?.[0]
  if (!reportTitle.value || !reportMonth.value || !reportYear.value || !file) {
    toast.error('Completa todos los campos y selecciona un archivo')
    return
  }
  const formData = new FormData()
  formData.append('title', reportTitle.value)
  formData.append('month', reportMonth.value)
  formData.append('year', reportYear.value)
  formData.append('file', file)

  try {
    await uploadReport(formData)
    toast.success('Informe subido correctamente')
    // Reset form
    reportTitle.value = ''
    reportMonth.value = ''
    reportYear.value = new Date().getFullYear().toString()
    if (fileInputRef.value) fileInputRef.value.value = ''
    // Refetch reports
    await fetchReports(1)
  }
  catch {
    toast.error(reportsError.value ?? 'Error al subir informe')
  }
}

// --- Reports pagination ---
const currentReportsPage = ref(1)

async function goToReportsPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentReportsPage.value = page
  await fetchReports(page)
}

function getReportMonthLabel(month: number): string {
  return meses[month - 1] ?? ''
}

// --- Money formatting ---
const { formatCurrency } = useFormatDate()

function formatBalance(balance: string): string {
  const num = parseFloat(balance)
  const prefix = num < 0 ? '- ' : ''
  return `${prefix}${formatCurrency(Math.abs(num))}`
}

// --- Init ---
onMounted(async () => {
  const today = new Date().toISOString().split('T')[0]
  if (!formDate.value) formDate.value = today
  if (!reportYear.value) reportYear.value = new Date().getFullYear().toString()
  await Promise.all([fetchSummary(), fetchUnits(), fetchReports(1)])
})
</script>

<template>
  <div>
    <!-- Topbar actions -->
    <Teleport :to="target" defer v-if="isMounted">
      <template v-if="activeTab === 'resumen'">
        <TopbarSearch v-model="searchQuery" placeholder="Buscar unidad...">
          <button
            class="relative flex size-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            @click="sortAsc = !sortAsc"
          >
            <ArrowUpDown class="size-3.5" />
          </button>
        </TopbarSearch>
      </template>
    </Teleport>

    <!-- Stats cards -->
    <div class="mb-6 grid grid-cols-2 gap-3">
      <div class="flex items-center gap-3 rounded-lg border bg-card p-4">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Building2 class="size-5 text-primary" />
        </div>
        <div>
          <p v-if="isLoading"><Skeleton class="h-5 w-8" /></p>
          <p v-else class="text-lg font-bold leading-none">{{ totalUnits }}</p>
          <p class="mt-0.5 text-sm text-muted-foreground">Total unidades</p>
        </div>
      </div>

      <div class="flex items-center gap-3 rounded-lg border bg-card p-4">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-destructive/10">
          <AlertTriangle class="size-5 text-destructive" />
        </div>
        <div>
          <p v-if="isLoading"><Skeleton class="h-5 w-8" /></p>
          <p v-else class="text-lg font-bold leading-none text-destructive">{{ totalInDebt }}</p>
          <p class="mt-0.5 text-sm text-muted-foreground">En mora</p>
        </div>
      </div>
    </div>

    <!-- Error alert -->
    <div
      v-if="error"
      role="alert"
      class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <!-- Tabs -->
    <Tabs v-model="activeTab" default-value="resumen">
      <TabsList class="w-full">
        <TabsTrigger value="resumen" class="flex-1">
          Resumen
        </TabsTrigger>
        <TabsTrigger value="movimiento" class="flex-1">
          Registrar
        </TabsTrigger>
        <TabsTrigger value="informes" class="flex-1">
          Informes
        </TabsTrigger>
      </TabsList>

      <!-- Tab 1: Resumen -->
      <TabsContent value="resumen" class="mt-4">
        <!-- Loading skeletons -->
        <div v-if="isLoading" class="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidad</TableHead>
                <TableHead>Etiqueta</TableHead>
                <TableHead class="text-right">
                  Saldo
                </TableHead>
                <TableHead class="text-right">
                  Estado
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="i in 5" :key="i">
                <TableCell><Skeleton class="h-4 w-12" /></TableCell>
                <TableCell><Skeleton class="h-4 w-24" /></TableCell>
                <TableCell class="text-right">
                  <Skeleton class="ml-auto h-4 w-20" />
                </TableCell>
                <TableCell class="text-right">
                  <Skeleton class="ml-auto h-5 w-16 rounded-lg" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="filteredSummaries.length === 0"
          class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"
        >
          <div class="flex size-12 items-center justify-center rounded-full bg-muted">
            <Wallet class="size-6 text-muted-foreground" />
          </div>
          <div>
            <p class="font-medium">No se encontraron unidades</p>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ searchQuery ? 'Intenta con otro termino de busqueda' : 'No hay unidades registradas' }}
            </p>
          </div>
        </div>

        <!-- Summary table -->
        <div v-else class="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidad</TableHead>
                <TableHead>Etiqueta</TableHead>
                <TableHead class="text-right">
                  Saldo
                </TableHead>
                <TableHead class="text-right">
                  Estado
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="summary in filteredSummaries" :key="summary.unitId">
                <TableCell class="font-medium">
                  {{ summary.unitNumber }}
                </TableCell>
                <TableCell class="text-muted-foreground">
                  {{ summary.unitLabel ?? '—' }}
                </TableCell>
                <TableCell
                  class="text-right font-semibold"
                  :class="summary.isInDebt ? 'text-destructive' : 'text-primary'"
                >
                  {{ formatBalance(summary.balance) }}
                </TableCell>
                <TableCell class="text-right">
                  <Badge :variant="summary.isInDebt ? 'destructive' : 'default'">
                    {{ summary.isInDebt ? 'En mora' : 'Al dia' }}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <!-- Tab 2: Registrar Movimiento -->
      <TabsContent value="movimiento" class="mt-4">
        <Card>
          <CardContent class="space-y-4 p-4 md:p-6">
            <div>
              <h2 class="text-base font-semibold">
                Registrar Movimiento
              </h2>
              <p class="mt-1 text-sm text-muted-foreground">
                Agrega un cargo o abono a una unidad
              </p>
            </div>

            <Separator />

            <!-- Error inline -->
            <div
              v-if="recordError"
              role="alert"
              class="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {{ recordError }}
            </div>

            <!-- Unit select -->
            <div class="space-y-2">
              <Label for="unit-select">Unidad</Label>
              <Select v-model="formUnit">
                <SelectTrigger id="unit-select" class="h-12">
                  <SelectValue placeholder="Selecciona una unidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="unit in units"
                    :key="unit.id"
                    :value="unit.id"
                  >
                    {{ unit.number }}{{ unit.label ? ` — ${unit.label}` : '' }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Type select -->
            <div class="space-y-2">
              <Label for="type-select">Tipo</Label>
              <Select v-model="formType">
                <SelectTrigger id="type-select" class="h-12">
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cargo">
                    Cargo
                  </SelectItem>
                  <SelectItem value="abono">
                    Abono
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Amount input -->
            <div class="space-y-2">
              <Label for="amount-input">Monto (Bs)</Label>
              <Input
                id="amount-input"
                v-model="formAmount"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                class="h-12"
              />
            </div>

            <!-- Description input -->
            <div class="space-y-2">
              <Label for="description-input">Descripcion</Label>
              <Input
                id="description-input"
                v-model="formDescription"
                type="text"
                placeholder="Ej: Cuota de condominio marzo 2026"
                class="h-12"
              />
            </div>

            <!-- Date input -->
            <div class="space-y-2">
              <Label for="date-input">Fecha</Label>
              <Input
                id="date-input"
                v-model="formDate"
                type="date"
                class="h-12"
              />
            </div>

            <!-- Submit button -->
            <Button
              class="w-full"
              :disabled="isSubmitting"
              @click="handleCreateRecord"
            >
              <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
              {{ isSubmitting ? 'Registrando...' : 'Registrar' }}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Tab 3: Informes -->
      <TabsContent value="informes" class="mt-4 space-y-6">
        <!-- Upload form -->
        <Card>
          <CardContent class="space-y-4 p-4 md:p-6">
            <div>
              <h2 class="text-base font-semibold">
                Subir Informe
              </h2>
              <p class="mt-1 text-sm text-muted-foreground">
                Sube un informe financiero en formato PDF
              </p>
            </div>

            <Separator />

            <!-- Error inline -->
            <div
              v-if="reportsError"
              role="alert"
              class="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {{ reportsError }}
            </div>

            <!-- Title input -->
            <div class="space-y-2">
              <Label for="report-title">Titulo</Label>
              <Input
                id="report-title"
                v-model="reportTitle"
                type="text"
                placeholder="Ej: Informe financiero mensual"
                class="h-12"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- Month select -->
              <div class="space-y-2">
                <Label for="report-month">Mes</Label>
                <Select v-model="reportMonth">
                  <SelectTrigger id="report-month" class="h-12">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="(mes, index) in meses"
                      :key="index"
                      :value="String(index + 1)"
                    >
                      {{ mes }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Year input -->
              <div class="space-y-2">
                <Label for="report-year">Ano</Label>
                <Input
                  id="report-year"
                  v-model="reportYear"
                  type="number"
                  :min="2020"
                  :max="2030"
                  class="h-12"
                />
              </div>
            </div>

            <!-- File input -->
            <div class="space-y-2">
              <Label for="report-file">Archivo PDF</Label>
              <input
                id="report-file"
                ref="fileInputRef"
                type="file"
                accept=".pdf"
                class="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
            </div>

            <!-- Upload button -->
            <Button
              class="w-full"
              :disabled="isUploading"
              @click="handleUploadReport"
            >
              <Loader2 v-if="isUploading" class="mr-2 size-4 animate-spin" />
              <Upload v-else class="mr-2 size-4" />
              {{ isUploading ? 'Subiendo...' : 'Subir Informe' }}
            </Button>
          </CardContent>
        </Card>

        <!-- Reports list -->
        <div>
          <h2 class="mb-3 text-base font-semibold">
            Informes Subidos
          </h2>

          <!-- Loading -->
          <div v-if="reportsLoading" class="space-y-3">
            <Skeleton v-for="i in 3" :key="i" class="h-20 w-full rounded-lg" />
          </div>

          <!-- Empty state -->
          <div
            v-else-if="reports.length === 0"
            class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"
          >
            <div class="flex size-12 items-center justify-center rounded-full bg-muted">
              <FileText class="size-6 text-muted-foreground" />
            </div>
            <div>
              <p class="font-medium">No hay informes subidos</p>
              <p class="mt-1 text-sm text-muted-foreground">
                Los informes financieros apareceran aqui
              </p>
            </div>
          </div>

          <!-- Report cards -->
          <div v-else class="space-y-3">
            <Card v-for="report in reports" :key="report.id">
              <CardContent class="flex items-center justify-between gap-3 p-4">
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium">
                    {{ report.title }}
                  </p>
                  <div class="mt-1 flex items-center gap-2">
                    <Badge variant="secondary">
                      {{ getReportMonthLabel(report.month) }} {{ report.year }}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  as="a"
                  :href="`/api/finance/reports/${report.filePath}`"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText class="mr-2 size-4" />
                  Descargar
                </Button>
              </CardContent>
            </Card>

            <!-- Pagination -->
            <div
              v-if="totalPages > 1"
              class="flex items-center justify-between pt-2"
            >
              <Button
                variant="outline"
                :disabled="currentReportsPage <= 1"
                @click="goToReportsPage(currentReportsPage - 1)"
              >
                <ChevronLeft class="mr-1 size-4" />
                Anterior
              </Button>
              <span class="text-sm text-muted-foreground">
                {{ currentReportsPage }} / {{ totalPages }}
              </span>
              <Button
                variant="outline"
                :disabled="currentReportsPage >= totalPages"
                @click="goToReportsPage(currentReportsPage + 1)"
              >
                Siguiente
                <ChevronRight class="ml-1 size-4" />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
