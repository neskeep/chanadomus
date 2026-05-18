<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { VehiclePassType } from '~~/shared/types/vehicle-pass'

useHead({ title: 'Nuevo Pase Vehicular' })

const router = useRouter()
const { createPass } = useVehiclePasses()

const isSubmitting = ref(false)

// Form
const formVehicleId = ref('')
const formPassType = ref<VehiclePassType>('resident')
const formOccupantLimit = ref<string>('')
const formExpiresAt = ref('')
const formNotes = ref('')

// Vehicles for select
interface VehicleOption {
  id: string
  plate: string
  brand: string | null
  model: string | null
  color: string | null
  unitNumber: string | null
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

const canSubmit = computed(() =>
  formVehicleId.value
  && !isSubmitting.value,
)

async function handleCreate() {
  if (!canSubmit.value) return

  isSubmitting.value = true
  try {
    const result = await createPass({
      vehicleId: formVehicleId.value,
      passType: formPassType.value,
      occupantLimit: formOccupantLimit.value ? Number(formOccupantLimit.value) : undefined,
      expiresAt: formExpiresAt.value || undefined,
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
})
</script>

<template>
  <div>
    <Card>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-6" @submit.prevent="handleCreate">
          <!-- Vehicle select -->
          <div class="space-y-1.5">
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
                  <template v-if="v.unitNumber"> ({{ v.unitNumber }})</template>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Pass type + Occupant limit -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="passType">Tipo de pase</Label>
              <Select v-model="formPassType">
                <SelectTrigger id="passType" size="lg" class="text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resident">Residente</SelectItem>
                  <SelectItem value="guest">Invitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
          </div>

          <!-- Expiry (only for guests) -->
          <div v-if="formPassType === 'guest'" class="space-y-1.5">
            <Label for="expiresAt">Fecha de vencimiento</Label>
            <Input
              id="expiresAt"
              v-model="formExpiresAt"
              type="datetime-local"
              class="h-12 text-base"
            />
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
