<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const unitId = route.params.id as string

const {
  isSubmitting,
  createVehicle,
} = useUnitVehicles(unitId)

const {
  members,
  fetchMembers,
} = useUnitMembers(unitId)

// Unit data for breadcrumb
const unit = ref<{ id: string, number: string, label: string | null } | null>(null)

async function fetchUnit() {
  try {
    const res = await $fetch<{ data: { id: string, number: string, label: string | null }[] }>('/api/units')
    unit.value = res.data.find(u => u.id === unitId) ?? null
  }
  catch {}
}

// Breadcrumb
const pageOverride = computed(() => {
  const unitLabel = unit.value ? `Unidad ${unit.value.number}` : 'Unidad'
  return {
    title: 'Agregar vehiculo',
    breadcrumbs: [
      { label: 'Unidades', to: '/admin/unidades' },
      { label: unitLabel, to: `/admin/unidades/${unitId}` },
    ],
  }
})
usePageInfoOverride(pageOverride)

// Form state
const form = ref({
  plate: '',
  brand: '',
  model: '',
  color: '',
  ownerMemberId: 'none',
})

const canSubmit = computed(() =>
  form.value.plate.trim().length > 0
  && form.value.brand.trim().length > 0
  && form.value.model.trim().length > 0
  && form.value.color.trim().length > 0
  && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    await createVehicle({
      plate: form.value.plate.trim().toUpperCase(),
      brand: form.value.brand.trim(),
      model: form.value.model.trim(),
      color: form.value.color.trim(),
      ownerMemberId: form.value.ownerMemberId === 'none' ? undefined : form.value.ownerMemberId || undefined,
    })
    toast.success('Vehiculo registrado')
    router.push(`/admin/unidades/${unitId}`)
  }
  catch {
    toast.error('Error al registrar vehiculo')
  }
}

onMounted(() => {
  fetchUnit()
  fetchMembers()
})
</script>

<template>
  <div>
    <Card>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div class="space-y-1.5">
            <Label for="vehicle-plate">Placa <span class="text-destructive">*</span></Label>
            <Input
              id="vehicle-plate"
              v-model="form.plate"
              placeholder="Ej: ABC123"
              required
              class="h-12 text-base uppercase"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="vehicle-brand">Marca <span class="text-destructive">*</span></Label>
              <Input
                id="vehicle-brand"
                v-model="form.brand"
                placeholder="Ej: Toyota"
                required
                class="h-12 text-base"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="vehicle-model">Modelo <span class="text-destructive">*</span></Label>
              <Input
                id="vehicle-model"
                v-model="form.model"
                placeholder="Ej: Corolla"
                required
                class="h-12 text-base"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label for="vehicle-color">Color <span class="text-destructive">*</span></Label>
            <Input
              id="vehicle-color"
              v-model="form.color"
              placeholder="Ej: Blanco"
              required
              class="h-12 text-base"
            />
          </div>

          <div class="space-y-1.5">
            <Label for="vehicle-owner">Propietario</Label>
            <Select v-model="form.ownerMemberId">
              <SelectTrigger id="vehicle-owner" size="lg" class="text-base">
                <SelectValue placeholder="Seleccionar miembro (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                <SelectItem v-for="member in members" :key="member.id" :value="member.id">
                  {{ member.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Registrando...' : 'Registrar vehiculo' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
