<script setup lang="ts">
import { Loader2, ArrowUpRight, ArrowDownLeft, CalendarIcon } from 'lucide-vue-next'
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import type { DateValue } from 'reka-ui'
import { toast } from 'vue-sonner'
import type { RecordType, RecordCategory } from '~~/shared/types/financial'

useHead({ title: 'Generar Cuotas' })

const router = useRouter()
const { units, fetchUnits } = useUnits()
const { isSubmitting, error, bulkCreate } = useFinanceBulk()
const { formatCurrency } = useFormatDate()

// --- Form state ---
const formType = ref<RecordType>('cargo')
const formCategory = ref<RecordCategory>('ordinaria')
const formAmount = ref('')
const formDescription = ref(defaultDescription())
const datePickerOpen = ref(false)

const t = today(getLocalTimeZone())
const formDate = shallowRef<DateValue>(new CalendarDate(t.year, t.month, 1))

const selectedUnitIds = ref<string[]>([])

function defaultDescription(): string {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const now = new Date()
  return `Cuota de condominio ${meses[now.getMonth()]} ${now.getFullYear()}`
}

function dateToISO(d: DateValue): string {
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}

function formatPickerDate(d: DateValue): string {
  const date = new Date(d.year, d.month - 1, d.day)
  return date.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Initialize all units selected once loaded
watch(units, (val) => {
  if (val.length > 0 && selectedUnitIds.value.length === 0) {
    selectedUnitIds.value = val.map(u => u.id)
  }
})

// --- Computed ---
const parsedAmount = computed(() => parseFloat(formAmount.value) || 0)
const previewTotal = computed(() => parsedAmount.value * selectedUnitIds.value.length)

const canSubmit = computed(() =>
  formType.value
  && formCategory.value
  && parsedAmount.value > 0
  && formDescription.value.trim().length > 0
  && formDate.value
  && selectedUnitIds.value.length > 0
  && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    const result = await bulkCreate({
      unitIds: selectedUnitIds.value,
      type: formType.value,
      category: formCategory.value,
      amount: formAmount.value,
      description: formDescription.value.trim(),
      date: dateToISO(formDate.value),
      skipDuplicates: true,
    })
    const msg = result.skipped > 0
      ? `${result.created} registros creados, ${result.skipped} omitidos (duplicados)`
      : `${result.created} registros creados`
    toast.success(msg)
    router.back()
  }
  catch {
    toast.error(error.value ?? 'Error al generar cuotas')
  }
}

onMounted(() => {
  fetchUnits()
})
</script>

<template>
  <div>
    <Card>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <ErrorAlert v-if="error" :message="error" />

          <!-- Type selector -->
          <div class="space-y-1.5">
            <Label>Tipo de movimiento <span class="text-destructive">*</span></Label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                class="flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors md:gap-3 md:p-3"
                :class="formType === 'cargo' ? 'border-destructive/40 bg-destructive/5' : 'hover:bg-muted/50'"
                @click="formType = 'cargo'"
              >
                <div class="flex size-8 shrink-0 items-center justify-center rounded-lg md:size-10" :class="formType === 'cargo' ? 'bg-destructive/10' : 'bg-muted'">
                  <ArrowUpRight class="size-4 md:size-5" :class="formType === 'cargo' ? 'text-destructive' : 'text-muted-foreground'" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold" :class="formType === 'cargo' ? 'text-destructive' : ''">Cargo</p>
                  <p class="truncate text-[11px] text-muted-foreground md:text-xs">Cobro al propietario</p>
                </div>
              </button>
              <button
                type="button"
                class="flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors md:gap-3 md:p-3"
                :class="formType === 'abono' ? 'border-primary/40 bg-primary/5' : 'hover:bg-muted/50'"
                @click="formType = 'abono'"
              >
                <div class="flex size-8 shrink-0 items-center justify-center rounded-lg md:size-10" :class="formType === 'abono' ? 'bg-primary/10' : 'bg-muted'">
                  <ArrowDownLeft class="size-4 md:size-5" :class="formType === 'abono' ? 'text-primary' : 'text-muted-foreground'" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold" :class="formType === 'abono' ? 'text-primary' : ''">Abono</p>
                  <p class="truncate text-[11px] text-muted-foreground md:text-xs">Pago recibido</p>
                </div>
              </button>
            </div>
          </div>

          <!-- Category selector -->
          <div class="space-y-1.5">
            <Label>Categoría <span class="text-destructive">*</span></Label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                class="flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors"
                :class="formCategory === 'ordinaria' ? 'border-primary/40 bg-primary/5' : 'hover:bg-muted/50'"
                @click="formCategory = 'ordinaria'"
              >
                <div class="min-w-0">
                  <p class="text-sm font-semibold" :class="formCategory === 'ordinaria' ? 'text-primary' : ''">Ordinaria</p>
                  <p class="text-[11px] text-muted-foreground">Cuotas regulares</p>
                </div>
              </button>
              <button
                type="button"
                class="flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors"
                :class="formCategory === 'extraordinaria' ? 'border-secondary/40 bg-secondary/5' : 'hover:bg-muted/50'"
                @click="formCategory = 'extraordinaria'"
              >
                <div class="min-w-0">
                  <p class="text-sm font-semibold" :class="formCategory === 'extraordinaria' ? 'text-secondary' : ''">Extraordinaria</p>
                  <p class="text-[11px] text-muted-foreground">Cobros especiales</p>
                </div>
              </button>
            </div>
          </div>

          <!-- Amount + Description -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="bulk-amount">Monto ($) <span class="text-destructive">*</span></Label>
              <Input
                id="bulk-amount"
                v-model="formAmount"
                type="number"
                inputmode="decimal"
                placeholder="0.00"
                min="0"
                step="0.01"
                class="h-12 text-base font-semibold tabular-nums"
              />
              <p class="text-xs text-muted-foreground">Monto por unidad, sin puntos de miles</p>
            </div>
            <div class="space-y-1.5">
              <Label for="bulk-description">Descripción <span class="text-destructive">*</span></Label>
              <Input
                id="bulk-description"
                v-model="formDescription"
                type="text"
                placeholder="Ej: Cuota de condominio junio 2026"
                class="h-12 text-base"
                maxlength="200"
              />
              <p class="text-xs text-muted-foreground">{{ formDescription.length }}/200</p>
            </div>
          </div>

          <!-- Date picker -->
          <div class="space-y-1.5">
            <Label>Fecha <span class="text-destructive">*</span></Label>
            <Popover v-model:open="datePickerOpen">
              <PopoverTrigger as-child>
                <Button variant="outline" class="h-12 w-full justify-start rounded-lg text-base font-normal sm:w-64">
                  <CalendarIcon class="mr-2 size-4 shrink-0 text-muted-foreground" />
                  <span class="truncate">{{ formatPickerDate(formDate) }}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0" align="start">
                <Calendar
                  :model-value="formDate"
                  locale="es"
                  @update:model-value="(v: DateValue | undefined) => { if (v) { formDate = v; datePickerOpen = false } }"
                />
              </PopoverContent>
            </Popover>
          </div>

          <!-- Unit multi-select -->
          <div class="space-y-1.5">
            <Label>Unidades <span class="text-destructive">*</span></Label>
            <UnitMultiSelect
              v-model="selectedUnitIds"
              :units="units"
            />
          </div>

          <!-- Preview -->
          <div v-if="parsedAmount > 0 && selectedUnitIds.length > 0" class="rounded-lg border bg-muted/30 p-4">
            <p class="text-sm font-medium">Resumen</p>
            <div class="mt-2 grid grid-cols-3 gap-4 text-center">
              <div>
                <p class="text-2xl font-bold tabular-nums">{{ selectedUnitIds.length }}</p>
                <p class="text-xs text-muted-foreground">Unidades</p>
              </div>
              <div>
                <p class="text-2xl font-bold tabular-nums">{{ formatCurrency(parsedAmount) }}</p>
                <p class="text-xs text-muted-foreground">Por unidad</p>
              </div>
              <div>
                <p class="text-2xl font-bold tabular-nums">{{ formatCurrency(previewTotal) }}</p>
                <p class="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Generando...' : `Generar ${selectedUnitIds.length} registros` }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
