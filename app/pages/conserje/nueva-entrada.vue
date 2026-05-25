<script setup lang="ts">
import { CheckCircle2, XCircle, Loader2 } from 'lucide-vue-next'
import type { AccessResult } from '~~/shared/types/access'

useHead({ title: 'Registrar Entrada' })

interface Unit {
  id: string
  number: string
  label: string | null
}

interface FormState {
  visitorName: string
  visitorDocument: string
  unitId: string
  visitorType: 'invitado' | 'proveedor'
  vehiclePlate: string
}

const form = reactive<FormState>({
  visitorName: '',
  visitorDocument: '',
  unitId: '',
  visitorType: 'invitado',
  vehiclePlate: '',
})

const units = ref<Unit[]>([])
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const lastResult = ref<{
  visitorName: string
  unitNumber: string
  result: AccessResult
} | null>(null)

const isValid = computed(() => {
  return form.visitorName.trim() !== '' && form.unitId !== ''
})

onMounted(async () => {
  try {
    const result = await $fetch('/api/units')
    units.value = result.data
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al cargar las unidades'
    error.value = message
  }
})

async function submit(result: 'allowed' | 'denied') {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true
  error.value = null

  try {
    const response = await $fetch('/api/access/manual', {
      method: 'POST',
      body: {
        visitorName: form.visitorName.trim(),
        visitorDocument: form.visitorDocument.trim() || undefined,
        unitId: form.unitId,
        visitorType: form.visitorType,
        vehiclePlate: form.vehiclePlate.trim() || undefined,
        result,
      },
    })

    lastResult.value = {
      visitorName: response.data.visitorName || form.visitorName.trim(),
      unitNumber: response.data.unitNumber || '',
      result: response.data.result,
    }

    // Reset form for next entry
    form.visitorName = ''
    form.visitorDocument = ''
    form.unitId = ''
    form.visitorType = 'invitado'
    form.vehiclePlate = ''
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al registrar la entrada'
    error.value = message
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div>
    <ErrorAlert :message="error" class="mb-4" />

    <Card>
      <CardContent class="space-y-6 p-4">
        <!-- Nombre visitante -->
        <div class="space-y-1.5">
          <Label for="visitor-name">Nombre del visitante <span class="text-destructive">*</span></Label>
          <Input
            id="visitor-name"
            v-model="form.visitorName"
            placeholder="Nombre completo"
            class="h-12 text-base"
            required
          />
        </div>

        <!-- Cédula -->
        <div class="space-y-1.5">
          <Label for="visitor-doc">Cédula <span class="text-xs text-muted-foreground">(opcional)</span></Label>
          <Input
            id="visitor-doc"
            v-model="form.visitorDocument"
            placeholder="V-12345678"
            class="h-12 text-base"
          />
        </div>

        <!-- Unidad destino -->
        <div class="space-y-1.5">
          <Label>Unidad destino <span class="text-destructive">*</span></Label>
          <UnitCombobox
            v-model="form.unitId"
            :units="units"
            placeholder="Buscar rancho..."
            required
          />
        </div>

        <!-- Tipo visitante (botones toggle) -->
        <div class="space-y-1.5">
          <Label>Tipo de visitante</Label>
          <div class="flex gap-2">
            <Button
              :variant="form.visitorType === 'invitado' ? 'default' : 'outline'"
              class="flex-1"
              @click="form.visitorType = 'invitado'"
            >
              Invitado
            </Button>
            <Button
              :variant="form.visitorType === 'proveedor' ? 'default' : 'outline'"
              class="flex-1"
              @click="form.visitorType = 'proveedor'"
            >
              Proveedor
            </Button>
          </div>
        </div>

        <!-- Placa vehículo -->
        <div class="space-y-1.5">
          <Label for="vehicle-plate">Placa del vehículo <span class="text-xs text-muted-foreground">(opcional)</span></Label>
          <Input
            id="vehicle-plate"
            v-model="form.vehiclePlate"
            placeholder="ABC-123"
            class="h-12 text-base"
          />
        </div>

        <Separator />

        <!-- Action buttons -->
        <div class="flex gap-3 pb-2">
          <Button
            :disabled="!isValid || isSubmitting"
            class="h-14 flex-1 bg-primary text-lg font-semibold text-white hover:bg-primary/90"
            @click="submit('allowed')"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-5 animate-spin" />
            <CheckCircle2 v-else class="mr-2 size-5" />
            Autorizar
          </Button>
          <Button
            variant="destructive"
            :disabled="!isValid || isSubmitting"
            class="h-14 flex-1 text-lg font-semibold"
            @click="submit('denied')"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-5 animate-spin" />
            <XCircle v-else class="mr-2 size-5" />
            Denegar
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Result card -->
    <Card v-if="lastResult" class="mt-4">
      <CardContent class="px-3 py-2.5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold">{{ lastResult.visitorName }}</p>
          <Badge variant="outline" class="text-[11px]">
            {{ lastResult.unitNumber }}
          </Badge>
        </div>
        <p
          class="text-[11px]"
          :class="lastResult.result === 'allowed' ? 'text-primary' : 'text-destructive'"
        >
          {{ lastResult.result === 'allowed' ? 'Acceso autorizado' : 'Acceso denegado' }}
        </p>
      </CardContent>
    </Card>
  </div>
</template>
