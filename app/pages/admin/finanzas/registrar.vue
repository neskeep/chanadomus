<script setup lang="ts">
import { Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { RecordType } from '~~/shared/types/financial'

useHead({ title: 'Registrar Movimiento' })

const router = useRouter()
const { isSubmitting, error, createRecord } = useFinanceRecords()
const { units, fetchUnits } = useUnits()

// --- Form state ---
const formUnit = ref('')
const formType = ref<RecordType | ''>('')
const formAmount = ref('')
const formDescription = ref('')
const formDate = ref(new Date().toISOString().split('T')[0])

const canSubmit = computed(() =>
  formUnit.value
  && formType.value
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
      amount: formAmount.value,
      description: formDescription.value,
      date: formDate.value,
    })
    toast.success('Movimiento registrado correctamente')
    router.push('/admin/finanzas')
  }
  catch {
    toast.error(error.value ?? 'Error al registrar movimiento')
  }
}

onMounted(() => {
  fetchUnits()
})
</script>

<template>
  <div class="mx-auto max-w-xl">
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
                class="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors"
                :class="formType === 'cargo'
                  ? 'border-destructive/40 bg-destructive/5'
                  : 'hover:bg-muted/50'"
                @click="formType = 'cargo'"
              >
                <div
                  class="flex size-10 shrink-0 items-center justify-center rounded-lg"
                  :class="formType === 'cargo' ? 'bg-destructive/10' : 'bg-muted'"
                >
                  <ArrowUpRight
                    class="size-5"
                    :class="formType === 'cargo' ? 'text-destructive' : 'text-muted-foreground'"
                  />
                </div>
                <div>
                  <p class="text-sm font-semibold" :class="formType === 'cargo' ? 'text-destructive' : ''">Cargo</p>
                  <p class="text-xs text-muted-foreground">Cobro al propietario</p>
                </div>
              </button>
              <button
                type="button"
                class="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors"
                :class="formType === 'abono'
                  ? 'border-primary/40 bg-primary/5'
                  : 'hover:bg-muted/50'"
                @click="formType = 'abono'"
              >
                <div
                  class="flex size-10 shrink-0 items-center justify-center rounded-lg"
                  :class="formType === 'abono' ? 'bg-primary/10' : 'bg-muted'"
                >
                  <ArrowDownLeft
                    class="size-5"
                    :class="formType === 'abono' ? 'text-primary' : 'text-muted-foreground'"
                  />
                </div>
                <div>
                  <p class="text-sm font-semibold" :class="formType === 'abono' ? 'text-primary' : ''">Abono</p>
                  <p class="text-xs text-muted-foreground">Pago recibido</p>
                </div>
              </button>
            </div>
          </div>

          <!-- Unit + Date row -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="unit-select">Unidad <span class="text-destructive">*</span></Label>
              <Select v-model="formUnit">
                <SelectTrigger id="unit-select" size="lg" class="text-base">
                  <SelectValue placeholder="Selecciona unidad" />
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

            <div class="space-y-1.5">
              <Label for="date-input">Fecha <span class="text-destructive">*</span></Label>
              <Input
                id="date-input"
                v-model="formDate"
                type="date"
                class="h-12 text-base"
              />
            </div>
          </div>

          <!-- Amount -->
          <div class="space-y-1.5">
            <Label for="amount-input">Monto (Bs) <span class="text-destructive">*</span></Label>
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
            <p class="text-xs text-muted-foreground">Ingresa el monto sin puntos de miles</p>
          </div>

          <!-- Description -->
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
