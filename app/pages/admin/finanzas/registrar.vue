<script setup lang="ts">
import { Loader2, ArrowUpRight, ArrowDownLeft, CalendarIcon } from 'lucide-vue-next'
import { getLocalTimeZone, today } from '@internationalized/date'
import type { DateValue } from 'reka-ui'
import { toast } from 'vue-sonner'
import type { RecordType, RecordCategory } from '~~/shared/types/financial'

useHead({ title: 'Registrar Movimiento' })

const router = useRouter()
const { isSubmitting, error, createRecord } = useFinanceRecords()
const { units, fetchUnits } = useUnits()

// --- Form state ---
const formUnit = ref('')
const formType = ref<RecordType | ''>('')
const formCategory = ref<RecordCategory | ''>('')
const formAmount = ref('')
const formDescription = ref('')
const formDate = shallowRef<DateValue>(today(getLocalTimeZone()))
const datePickerOpen = ref(false)

function dateToISO(d: DateValue): string {
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}

function formatPickerDate(d: DateValue): string {
  const date = new Date(d.year, d.month - 1, d.day)
  return date.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })
}

const canSubmit = computed(() =>
  formUnit.value
  && formType.value
  && formCategory.value
  && formAmount.value
  && parseFloat(formAmount.value) > 0
  && formDescription.value.trim().length > 0
  && formDate.value
  && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    await createRecord({
      unitId: formUnit.value,
      type: formType.value as RecordType,
      category: formCategory.value as RecordCategory,
      amount: formAmount.value,
      description: formDescription.value,
      date: dateToISO(formDate.value),
    })
    toast.success('Movimiento registrado correctamente')
    router.back()
  }
  catch (err: unknown) {
    const statusCode = (err as { statusCode?: number })?.statusCode
    if (statusCode === 409) {
      toast.warning('Este movimiento ya fue registrado previamente')
      router.back()
      return
    }
    toast.error(error.value ?? 'Error al registrar movimiento')
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
            <Label>Categoría <span class="text-destructive">*</span></Label>
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

          <!-- Unit + Date row -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label>Unidad <span class="text-destructive">*</span></Label>
              <UnitCombobox
                v-model="formUnit"
                :units="units"
                placeholder="Buscar unidad..."
                required
              />
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
              <Label for="description-input">Descripción <span class="text-destructive">*</span></Label>
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
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Registrando...' : 'Registrar Movimiento' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
