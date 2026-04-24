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
  <div class="min-h-screen bg-background">
    <!-- Error alert -->
    <div
      v-if="error"
      role="alert"
      class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <div class="space-y-5">
      <!-- Nombre visitante -->
      <div class="space-y-2">
        <Label for="visitor-name">Nombre del visitante <span class="text-destructive">*</span></Label>
        <Input
          id="visitor-name"
          v-model="form.visitorName"
          placeholder="Nombre completo"
          required
        />
      </div>

      <!-- Cédula -->
      <div class="space-y-2">
        <Label for="visitor-doc">Cédula <span class="text-xs text-muted-foreground">(opcional)</span></Label>
        <Input
          id="visitor-doc"
          v-model="form.visitorDocument"
          placeholder="V-12345678"
        />
      </div>

      <!-- Unidad destino -->
      <div class="space-y-2">
        <Label for="unit-select">Unidad destino <span class="text-destructive">*</span></Label>
        <Select v-model="form.unitId">
          <SelectTrigger id="unit-select" class="w-full">
            <SelectValue placeholder="Seleccionar unidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="unit in units" :key="unit.id" :value="unit.id">
              {{ unit.number }}{{ unit.label ? ` — ${unit.label}` : '' }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Tipo visitante (botones toggle) -->
      <div class="space-y-2">
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
      <div class="space-y-2">
        <Label for="vehicle-plate">Placa del vehículo <span class="text-xs text-muted-foreground">(opcional)</span></Label>
        <Input
          id="vehicle-plate"
          v-model="form.vehiclePlate"
          placeholder="ABC-123"
        />
      </div>

      <Separator />

      <!-- Action buttons -->
      <div class="flex gap-3 pb-6">
        <Button
          :disabled="!isValid || isSubmitting"
          class="h-14 flex-1 bg-green-600 text-lg font-semibold text-white hover:bg-green-700"
          @click="submit('allowed')"
        >
          <Loader2 v-if="isSubmitting" class="mr-2 size-5 animate-spin" />
          <CheckCircle2 v-else class="mr-2 size-5" />
          Autorizar
        </Button>
        <Button
          :disabled="!isValid || isSubmitting"
          class="h-14 flex-1 bg-red-600 text-lg font-semibold text-white hover:bg-red-700"
          @click="submit('denied')"
        >
          <Loader2 v-if="isSubmitting" class="mr-2 size-5 animate-spin" />
          <XCircle v-else class="mr-2 size-5" />
          Denegar
        </Button>
      </div>

      <!-- Success card -->
      <Card
        v-if="lastResult"
        class="border-l-4"
        :class="lastResult.result === 'allowed' ? 'border-l-green-500' : 'border-l-red-500'"
      >
        <CardContent class="flex items-center justify-between p-4">
          <div>
            <p class="font-semibold">{{ lastResult.visitorName }}</p>
            <p class="text-sm text-muted-foreground">
              {{ lastResult.result === 'allowed' ? 'Acceso autorizado' : 'Acceso denegado' }}
            </p>
          </div>
          <Badge :variant="lastResult.result === 'allowed' ? 'default' : 'destructive'">
            {{ lastResult.unitNumber }}
          </Badge>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
