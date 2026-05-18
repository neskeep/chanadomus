<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

useHead({ title: 'Agregar Vehículo' })

const router = useRouter()
const { members, isSubmitting, error, createVehicle, fetchMembers } = useMyUnit()

const formPlate = ref('')
const formBrand = ref('')
const formModel = ref('')
const formColor = ref('')
const formOwnerMemberId = ref('none')

const canSubmit = computed(() =>
  formPlate.value.trim().length > 0
  && formBrand.value.trim().length > 0
  && formModel.value.trim().length > 0
  && formColor.value.trim().length > 0
  && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    await createVehicle({
      plate: formPlate.value.trim().toUpperCase(),
      brand: formBrand.value.trim(),
      model: formModel.value.trim(),
      color: formColor.value.trim(),
      ownerMemberId: formOwnerMemberId.value === 'none' ? undefined : formOwnerMemberId.value || undefined,
    })
    toast.success('Vehículo registrado correctamente')
    router.push('/propietario/mi-unidad')
  }
  catch {
    toast.error(error.value ?? 'Error al guardar')
  }
}

onMounted(() => fetchMembers())
</script>

<template>
  <div>
    <Card>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <ErrorAlert v-if="error" :message="error" />

          <div class="space-y-1.5">
            <Label for="vehicle-plate">Placa <span class="text-destructive">*</span></Label>
            <Input
              id="vehicle-plate"
              v-model="formPlate"
              placeholder="Ej: ABC123"
              class="h-12 text-base uppercase"
              required
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="vehicle-brand">Marca <span class="text-destructive">*</span></Label>
              <Input
                id="vehicle-brand"
                v-model="formBrand"
                placeholder="Ej: Toyota"
                class="h-12 text-base"
                required
              />
            </div>
            <div class="space-y-1.5">
              <Label for="vehicle-model">Modelo <span class="text-destructive">*</span></Label>
              <Input
                id="vehicle-model"
                v-model="formModel"
                placeholder="Ej: Corolla"
                class="h-12 text-base"
                required
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="vehicle-color">Color <span class="text-destructive">*</span></Label>
              <Input
                id="vehicle-color"
                v-model="formColor"
                placeholder="Ej: Blanco"
                class="h-12 text-base"
                required
              />
            </div>
            <div class="space-y-1.5">
              <Label for="vehicle-owner">Propietario</Label>
              <Select v-model="formOwnerMemberId">
                <SelectTrigger id="vehicle-owner" size="lg" class="text-base">
                  <SelectValue placeholder="Seleccionar (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  <SelectItem v-for="member in members" :key="member.id" :value="member.id">
                    {{ member.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Guardando...' : 'Agregar Vehículo' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
