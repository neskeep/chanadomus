<script setup lang="ts">
import { Loader2, ArrowUpRight, ArrowDownLeft, CalendarIcon, Trash2 } from 'lucide-vue-next'
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import type { DateValue } from 'reka-ui'
import { toast } from 'vue-sonner'
import type { RecordType, RecordCategory, FinancialRecord } from '~~/shared/types/financial'

useHead({ title: 'Editar Movimiento' })

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const { isSubmitting, error, updateRecord, deleteRecord } = useFinanceRecords()
const { units, fetchUnits } = useUnits()

// --- Loading state ---
const record = ref<FinancialRecord | null>(null)
const loadingRecord = ref(true)
const loadError = ref<string | null>(null)

// --- Form state ---
const formType = ref<RecordType | ''>('')
const formCategory = ref<RecordCategory | ''>('')
const formAmount = ref('')
const formDescription = ref('')
const formDate = shallowRef<DateValue>(today(getLocalTimeZone()))
const datePickerOpen = ref(false)
const isDeleting = ref(false)

function dateToISO(d: DateValue): string {
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}

function formatPickerDate(d: DateValue): string {
  const date = new Date(d.year, d.month - 1, d.day)
  return date.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })
}

const unitLabel = computed(() => {
  if (!record.value) return ''
  const unit = units.value.find(u => u.id === record.value?.unitId)
  return unit ? (unit.label || unit.number) : record.value.unitId
})

const canSubmit = computed(() =>
  formType.value
  && formCategory.value
  && formAmount.value
  && parseFloat(formAmount.value) > 0
  && formDescription.value.trim().length > 0
  && formDate.value
  && !isSubmitting.value,
)

async function loadRecordData() {
  loadingRecord.value = true
  loadError.value = null
  try {
    const res = await $fetch<{ data: FinancialRecord }>(`/api/finance/records/${id}`)
    record.value = res.data

    // Pre-fill form
    formType.value = res.data.type
    formCategory.value = res.data.category
    formAmount.value = res.data.amount
    formDescription.value = res.data.description

    // Parse ISO date to CalendarDate extrayendo componentes directamente (evita shift de timezone)
    const [y, m, day] = res.data.date.split('T')[0].split('-').map(Number)
    formDate.value = new CalendarDate(y, m, day)
  }
  catch (err: unknown) {
    loadError.value = err instanceof Error ? err.message : 'Error al cargar registro'
  }
  finally {
    loadingRecord.value = false
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    await updateRecord(id, {
      type: formType.value as RecordType,
      category: formCategory.value as RecordCategory,
      amount: formAmount.value,
      description: formDescription.value,
      date: dateToISO(formDate.value),
    })
    toast.success('Movimiento actualizado correctamente')
    router.back()
  }
  catch {
    toast.error(error.value ?? 'Error al actualizar movimiento')
  }
}

async function handleDelete() {
  isDeleting.value = true
  try {
    await deleteRecord(id)
    toast.success('Movimiento eliminado correctamente')
    router.back()
  }
  catch {
    toast.error(error.value ?? 'Error al eliminar movimiento')
    isDeleting.value = false
  }
}

onMounted(() => {
  loadRecordData()
  fetchUnits()
})
</script>

<template>
  <div>
    <Card>
      <CardContent class="p-5 md:p-8">
        <!-- Loading skeleton -->
        <div v-if="loadingRecord" class="space-y-6">
          <div class="space-y-1.5">
            <Skeleton class="h-4 w-32" />
            <div class="grid grid-cols-2 gap-3">
              <Skeleton class="h-16 rounded-lg" />
              <Skeleton class="h-16 rounded-lg" />
            </div>
          </div>
          <div class="space-y-1.5">
            <Skeleton class="h-4 w-24" />
            <div class="grid grid-cols-2 gap-3">
              <Skeleton class="h-14 rounded-lg" />
              <Skeleton class="h-14 rounded-lg" />
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Skeleton class="h-4 w-16" />
              <Skeleton class="h-12 rounded-lg" />
            </div>
            <div class="space-y-1.5">
              <Skeleton class="h-4 w-16" />
              <Skeleton class="h-12 rounded-lg" />
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Skeleton class="h-4 w-20" />
              <Skeleton class="h-12 rounded-lg" />
            </div>
            <div class="space-y-1.5">
              <Skeleton class="h-4 w-24" />
              <Skeleton class="h-12 rounded-lg" />
            </div>
          </div>
          <Skeleton class="h-12 w-full rounded-lg" />
        </div>

        <!-- Load error -->
        <div v-else-if="loadError" class="py-12 text-center">
          <p class="text-destructive">{{ loadError }}</p>
          <Button variant="outline" class="mt-4" @click="loadRecordData">
            Reintentar
          </Button>
        </div>

        <!-- Form -->
        <form v-else class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Error -->
          <ErrorAlert v-if="error" :message="error" />

          <!-- Type selector (cargo / abono) -->
          <div class="space-y-1.5">
            <Label>Tipo de movimiento <span class="text-destructive">*</span></Label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                class="flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors md:gap-3 md:p-3"
                :class="formType === 'cargo'
                  ? 'border-destructive/40 bg-destructive/5'
                  : 'hover:bg-muted/50'"
                @click="formType = 'cargo'"
              >
                <div
                  class="flex size-8 shrink-0 items-center justify-center rounded-lg md:size-10"
                  :class="formType === 'cargo' ? 'bg-destructive/10' : 'bg-muted'"
                >
                  <ArrowUpRight
                    class="size-4 md:size-5"
                    :class="formType === 'cargo' ? 'text-destructive' : 'text-muted-foreground'"
                  />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold" :class="formType === 'cargo' ? 'text-destructive' : ''">Cargo</p>
                  <p class="truncate text-[11px] text-muted-foreground md:text-xs">Cobro al propietario</p>
                </div>
              </button>
              <button
                type="button"
                class="flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors md:gap-3 md:p-3"
                :class="formType === 'abono'
                  ? 'border-primary/40 bg-primary/5'
                  : 'hover:bg-muted/50'"
                @click="formType = 'abono'"
              >
                <div
                  class="flex size-8 shrink-0 items-center justify-center rounded-lg md:size-10"
                  :class="formType === 'abono' ? 'bg-primary/10' : 'bg-muted'"
                >
                  <ArrowDownLeft
                    class="size-4 md:size-5"
                    :class="formType === 'abono' ? 'text-primary' : 'text-muted-foreground'"
                  />
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
            <Label>Categoria <span class="text-destructive">*</span></Label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                class="flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors"
                :class="formCategory === 'ordinaria'
                  ? 'border-primary/40 bg-primary/5'
                  : 'hover:bg-muted/50'"
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
                :class="formCategory === 'extraordinaria'
                  ? 'border-secondary/40 bg-secondary/5'
                  : 'hover:bg-muted/50'"
                @click="formCategory = 'extraordinaria'"
              >
                <div class="min-w-0">
                  <p class="text-sm font-semibold" :class="formCategory === 'extraordinaria' ? 'text-secondary' : ''">Extraordinaria</p>
                  <p class="text-[11px] text-muted-foreground">Cobros especiales</p>
                </div>
              </button>
            </div>
          </div>

          <!-- Unit (readonly) + Date row -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label>Unidad</Label>
              <div class="flex h-12 items-center rounded-lg border bg-muted/50 px-3 text-base text-muted-foreground">
                {{ unitLabel }}
              </div>
            </div>

            <div class="space-y-1.5">
              <Label>Fecha <span class="text-destructive">*</span></Label>
              <Popover v-model:open="datePickerOpen">
                <PopoverTrigger as-child>
                  <Button variant="outline" class="h-12 w-full justify-start rounded-lg text-base font-normal">
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
          </div>

          <!-- Amount + Description row -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="amount-input">Monto ($) <span class="text-destructive">*</span></Label>
              <Input
                id="amount-input"
                v-model="formAmount"
                type="number"
                inputmode="decimal"
                placeholder="0.00"
                min="0"
                step="0.01"
                class="h-12 text-base font-semibold tabular-nums"
              />
              <p class="text-xs text-muted-foreground">Sin puntos de miles</p>
            </div>
            <div class="space-y-1.5">
              <Label for="description-input">Descripcion <span class="text-destructive">*</span></Label>
              <Input
                id="description-input"
                v-model="formDescription"
                type="text"
                placeholder="Ej: Cuota de condominio abril 2026"
                class="h-12 text-base"
                maxlength="200"
              />
              <p class="text-xs text-muted-foreground">{{ formDescription.length }}/200</p>
            </div>
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting && !isDeleting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting && !isDeleting ? 'Guardando...' : 'Guardar Cambios' }}
          </Button>

          <!-- Delete -->
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button
                type="button"
                variant="outline"
                class="h-12 w-full text-base text-destructive hover:bg-destructive/5"
                :disabled="isDeleting"
              >
                <Loader2 v-if="isDeleting" class="mr-2 size-4 animate-spin" />
                <Trash2 v-else class="mr-2 size-4" />
                {{ isDeleting ? 'Eliminando...' : 'Eliminar registro' }}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar este registro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta accion no se puede deshacer. El movimiento sera eliminado permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" @click="handleDelete">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
