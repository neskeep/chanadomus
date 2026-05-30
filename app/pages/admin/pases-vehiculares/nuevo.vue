<script setup lang="ts">
import { Loader2, CalendarIcon } from 'lucide-vue-next'
import { getLocalTimeZone, today } from '@internationalized/date'
import type { DateValue } from 'reka-ui'
import { toast } from 'vue-sonner'
import type { VehiclePassType } from '~~/shared/types/vehicle-pass'

useHead({ title: 'Nuevo Pase Vehicular' })

const router = useRouter()
const { createPass } = useVehiclePasses()

const isSubmitting = ref(false)

// Form
const formPassType = ref<VehiclePassType>('resident')
const formVehicleId = ref('')
const formDescription = ref('')
const formUnitId = ref<string | undefined>(undefined)
const formOccupantLimit = ref<string>('')
const formNotes = ref('')

const isTemporary = computed(() => formPassType.value === 'temporary')

// Date/time picker state
const expiresDate = shallowRef<DateValue>(today(getLocalTimeZone()).add({ days: 1 }))
const datePickerOpen = ref(false)

const now = new Date()
const currentH = now.getHours()
const roundedMin = Math.ceil(now.getMinutes() / 5) * 5
const overflowHour = roundedMin >= 60

const expiresHour = ref(String((() => {
  let h = overflowHour ? currentH + 1 : currentH
  if (h >= 24) h = 0
  if (h === 0) return 12
  if (h > 12) return h - 12
  return h
})()))
const expiresMinute = ref(String(overflowHour ? 0 : roundedMin).padStart(2, '0'))
const expiresPeriod = ref<'AM' | 'PM'>((overflowHour ? currentH + 1 : currentH) >= 12 ? 'PM' : 'AM')

const hourOptions = Array.from({ length: 12 }, (_, i) => String(i + 1))
const minuteOptions = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

const expiresAtISO = computed(() => {
  const d = expiresDate.value
  let h = Number(expiresHour.value)
  if (expiresPeriod.value === 'AM' && h === 12) h = 0
  else if (expiresPeriod.value === 'PM' && h !== 12) h = h + 12
  return new Date(d.year, d.month - 1, d.day, h, Number(expiresMinute.value)).toISOString()
})

function formatSelectedDate(d: DateValue): string {
  const date = new Date(d.year, d.month - 1, d.day)
  const formatted = date.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

// Reset dependent fields when pass type changes
watch(formPassType, () => {
  formVehicleId.value = ''
  formDescription.value = ''
  formUnitId.value = undefined
})

// Vehicles for select
interface VehicleOption {
  id: string
  plate: string
  brand: string | null
  model: string | null
  color: string | null
  unitNumber: string | null
  unitLabel: string | null
}

const vehicles = ref<VehicleOption[]>([])
const isLoadingVehicles = ref(false)

async function loadVehicles() {
  isLoadingVehicles.value = true
  try {
    const res = await $fetch<{ data: VehicleOption[] }>('/api/vehicles')
    vehicles.value = res.data
  }
  catch {
    toast.error('Error al cargar vehículos')
  }
  finally {
    isLoadingVehicles.value = false
  }
}

// Units for combobox
const units = ref<Array<{ id: string; number: string; label: string | null }>>([])

async function loadUnits() {
  try {
    const res = await $fetch<{ data: Array<{ id: string; number: string; label: string | null }> }>('/api/units')
    units.value = res.data
  }
  catch {
    // silent
  }
}

// Show date picker for guest and temporary
const showExpiry = computed(() => formPassType.value === 'guest' || isTemporary.value)

const canSubmit = computed(() => {
  if (isSubmitting.value) return false
  if (isTemporary.value) {
    return formDescription.value.trim() !== ''
  }
  return formVehicleId.value !== ''
})

async function handleCreate() {
  if (!canSubmit.value) return

  isSubmitting.value = true
  try {
    const result = await createPass({
      vehicleId: isTemporary.value ? undefined : formVehicleId.value,
      passType: formPassType.value,
      description: isTemporary.value ? formDescription.value.trim() : undefined,
      unitId: isTemporary.value && formUnitId.value ? formUnitId.value : undefined,
      occupantLimit: formOccupantLimit.value ? Number(formOccupantLimit.value) : undefined,
      expiresAt: showExpiry.value ? expiresAtISO.value : undefined,
      notes: formNotes.value || undefined,
    })

    if (result) {
      toast.success('Pase vehicular creado')
      router.push('/admin/pases-vehiculares')
    }
  }
  catch {
    toast.error('Error al crear pase')
  }
  finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadVehicles()
  loadUnits()
})
</script>

<template>
  <div>
    <Card>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-6" @submit.prevent="handleCreate">
          <!-- Pass type -->
          <div class="space-y-1.5">
            <Label for="passType">Tipo de pase <span class="text-destructive">*</span></Label>
            <Select v-model="formPassType">
              <SelectTrigger id="passType" size="lg" class="text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resident">Residente</SelectItem>
                <SelectItem value="guest">Invitado</SelectItem>
                <SelectItem value="temporary">Temporal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Vehicle select (resident/guest only) -->
          <div v-if="!isTemporary" class="space-y-1.5">
            <Label for="vehicle">Vehículo <span class="text-destructive">*</span></Label>
            <Select v-model="formVehicleId">
              <SelectTrigger id="vehicle" size="lg" class="text-base">
                <SelectValue placeholder="Seleccionar vehículo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-if="isLoadingVehicles" value="__loading" disabled>
                  Cargando...
                </SelectItem>
                <SelectItem
                  v-for="v in vehicles"
                  :key="v.id"
                  :value="v.id"
                >
                  {{ v.plate }} — {{ [v.brand, v.model, v.color].filter(Boolean).join(' ') }}
                  <template v-if="v.unitNumber"> ({{ v.unitLabel || v.unitNumber }})</template>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Temporary pass fields -->
          <template v-if="isTemporary">
            <!-- Description (required for temporary) -->
            <div class="space-y-1.5">
              <Label for="description">Descripción <span class="text-destructive">*</span></Label>
              <Input
                id="description"
                v-model="formDescription"
                type="text"
                placeholder="Ej: Taxi para mudanza, Grúa de servicio"
                class="h-12 text-base"
              />
            </div>

            <!-- Unit combobox (optional for temporary) -->
            <div class="space-y-1.5">
              <Label>Rancho asignado</Label>
              <UnitCombobox v-model="formUnitId" :units="units" placeholder="Sin asignar (condominio general)" />
              <p class="text-xs text-muted-foreground">
                Opcional. Deja vacío para pases del condominio general.
              </p>
            </div>
          </template>

          <!-- Occupant limit -->
          <div class="space-y-1.5">
            <Label for="occupantLimit">Max. ocupantes</Label>
            <Input
              id="occupantLimit"
              v-model="formOccupantLimit"
              type="number"
              min="1"
              max="20"
              placeholder="Sin límite"
              class="h-12 text-base"
            />
          </div>

          <!-- Expiry date/time (guests and temporary) -->
          <div v-if="showExpiry" class="space-y-1.5">
            <Label>
              Fecha de vencimiento
              <span v-if="isTemporary" class="text-destructive">*</span>
            </Label>
            <div class="grid grid-cols-2 gap-4">
              <!-- Date picker -->
              <Popover v-model:open="datePickerOpen">
                <PopoverTrigger as-child>
                  <Button variant="outline" class="h-12 w-full justify-start rounded-lg text-base font-normal">
                    <CalendarIcon class="mr-2 size-4 shrink-0 text-muted-foreground" />
                    <span class="truncate">{{ formatSelectedDate(expiresDate) }}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar
                    :model-value="expiresDate"
                    locale="es"
                    :min-value="today(getLocalTimeZone())"
                    @update:model-value="(v: DateValue | undefined) => { if (v) { expiresDate = v; datePickerOpen = false } }"
                  />
                </PopoverContent>
              </Popover>

              <!-- Time picker -->
              <div class="flex items-center gap-1.5">
                <Select v-model="expiresHour">
                  <SelectTrigger size="lg" class="w-full text-center text-base">
                    <SelectValue placeholder="H" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="h in hourOptions" :key="h" :value="h">{{ h }}</SelectItem>
                  </SelectContent>
                </Select>
                <span class="text-lg text-muted-foreground">:</span>
                <Select v-model="expiresMinute">
                  <SelectTrigger size="lg" class="w-full text-center text-base">
                    <SelectValue placeholder="M" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="m in minuteOptions" :key="m" :value="m">{{ m }}</SelectItem>
                  </SelectContent>
                </Select>
                <Select v-model="expiresPeriod">
                  <SelectTrigger size="lg" class="w-full text-center text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="space-y-1.5">
            <Label for="notes">Notas</Label>
            <Textarea
              id="notes"
              v-model="formNotes"
              placeholder="Observaciones sobre el pase"
              rows="2"
              class="text-base"
            />
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Creando...' : 'Crear Pase Vehicular' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
