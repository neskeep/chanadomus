<script setup lang="ts">
import { Loader2, UserPlus } from 'lucide-vue-next'
import type { VisitorType } from '~~/shared/types/qr'

useHead({ title: 'Agregar Visitante Frecuente' })

const { addVisitor, isSubmitting, error } = useFrequentVisitors()
const { unitId, fetchUnit, isLoading: isLoadingUnit, error: unitError } = useConserjeUnit()

const visitorName = ref('')
const visitorDocument = ref('')
const visitorType = ref<VisitorType>('invitado')
const vehiclePlate = ref('')

onMounted(() => {
  fetchUnit()
})

const isFormValid = computed(() => {
  return visitorName.value.trim() !== '' && visitorDocument.value.trim() !== '' && !!unitId.value
})

async function handleSubmit() {
  if (!isFormValid.value || !unitId.value) return

  try {
    await addVisitor({
      visitorName: visitorName.value.trim(),
      visitorDocument: visitorDocument.value.trim() || undefined,
      visitorType: visitorType.value,
      vehiclePlate: vehiclePlate.value.trim() || undefined,
      unitId: unitId.value,
    })
    navigateTo('/conserje/visitantes-frecuentes')
  }
  catch {
    // Error handled by composable
  }
}
</script>

<template>
  <div>
    <!-- Unit loading -->
    <div v-if="isLoadingUnit" class="flex items-center justify-center py-12">
      <Loader2 class="size-6 animate-spin text-muted-foreground" />
    </div>

    <ErrorAlert v-else-if="unitError" :message="unitError" class="mb-4" />

    <template v-else>
      <!-- Error alert -->
      <ErrorAlert :message="error" class="mb-4" />

      <form @submit.prevent="handleSubmit">
        <Card>
          <CardContent class="space-y-6 p-4">
            <!-- Nombre -->
            <div class="space-y-1.5">
              <Label for="visitor-name">Nombre <span class="text-destructive">*</span></Label>
              <Input
                id="visitor-name"
                v-model="visitorName"
                placeholder="Nombre completo"
                required
                class="h-12 text-base"
              />
            </div>

            <!-- Cedula -->
            <div class="space-y-1.5">
              <Label for="visitor-document">Cédula <span class="text-destructive">*</span></Label>
              <Input
                id="visitor-document"
                v-model="visitorDocument"
                placeholder="V-12345678"
                required
                class="h-12 text-base"
              />
            </div>

            <!-- Tipo -->
            <div class="space-y-1.5">
              <Label for="visitor-type">Tipo</Label>
              <Select v-model="visitorType">
                <SelectTrigger id="visitor-type" size="lg" class="w-full text-base">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invitado">Invitado</SelectItem>
                  <SelectItem value="proveedor">Proveedor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Placa -->
            <div class="space-y-1.5">
              <Label for="vehicle-plate">Placa del vehiculo <span class="text-xs text-muted-foreground">(opcional)</span></Label>
              <Input
                id="vehicle-plate"
                v-model="vehiclePlate"
                placeholder="ABC123"
                class="h-12 text-base"
              />
            </div>

            <!-- Submit -->
            <Button
              type="submit"
              class="mt-3 h-12 w-full text-base font-semibold"
              :disabled="!isFormValid || isSubmitting"
            >
              <Loader2 v-if="isSubmitting" class="size-4 animate-spin" />
              <UserPlus v-else class="size-4" />
              {{ isSubmitting ? 'Guardando...' : 'Agregar visitante' }}
            </Button>
          </CardContent>
        </Card>
      </form>
    </template>
  </div>
</template>
