<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'default' })
useHead({ title: 'Editar Unidad' })

const route = useRoute()
const router = useRouter()
const unitId = route.params.id as string

// Unit data
const unit = ref<{ id: string, number: string, label: string | null, isActive: boolean } | null>(null)
const unitLoading = ref(true)
const error = ref('')
const isSubmitting = ref(false)

// Form state
const form = ref({
  number: '',
  label: '',
  isActive: true,
})

// Snapshot of initial values to detect changes
const initialForm = ref({
  number: '',
  label: '',
  isActive: true,
})

async function fetchUnit() {
  unitLoading.value = true
  try {
    const res = await $fetch<{ data: { id: string, number: string, label: string | null, isActive: boolean }[] }>('/api/units')
    unit.value = res.data.find(u => u.id === unitId) ?? null
    if (unit.value) {
      form.value = {
        number: unit.value.number,
        label: unit.value.label ?? '',
        isActive: unit.value.isActive,
      }
      initialForm.value = { ...form.value }
    }
  }
  catch {
    error.value = 'Error al cargar datos de la unidad'
  }
  finally {
    unitLoading.value = false
  }
}

// Breadcrumb
const pageOverride = computed(() => {
  if (unitLoading.value) return null
  if (!unit.value) return { title: 'Unidad no encontrada' }
  return {
    title: 'Editar Unidad',
    breadcrumbs: [
      { label: 'Unidades', to: '/admin/unidades' },
      { label: `Unidad ${unit.value.number}`, to: `/admin/unidades/${unitId}` },
    ],
  }
})
usePageInfoOverride(pageOverride)

const hasChanges = computed(() =>
  form.value.number !== initialForm.value.number
  || form.value.label !== initialForm.value.label
  || form.value.isActive !== initialForm.value.isActive,
)

const canSubmit = computed(() =>
  form.value.number.trim().length > 0
  && hasChanges.value
  && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  error.value = ''
  isSubmitting.value = true
  try {
    await $fetch(`/api/units/${unitId}`, {
      method: 'PATCH',
      body: {
        number: form.value.number.trim(),
        label: form.value.label.trim() || null,
        isActive: form.value.isActive,
      },
    })
    toast.success('Unidad actualizada')
    router.push(`/admin/unidades/${unitId}`)
  }
  catch {
    error.value = 'Error al actualizar la unidad'
  }
  finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchUnit()
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="unitLoading" class="space-y-6">
      <Card>
        <CardContent class="space-y-6 p-5 md:p-8">
          <div class="space-y-1.5">
            <Skeleton class="h-4 w-20" />
            <Skeleton class="h-12 w-full" />
          </div>
          <div class="space-y-1.5">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-12 w-full" />
          </div>
          <div class="space-y-1.5">
            <Skeleton class="h-4 w-16" />
            <Skeleton class="h-10 w-48" />
          </div>
          <Skeleton class="h-12 w-full" />
        </CardContent>
      </Card>
    </div>

    <!-- Not found -->
    <div v-else-if="!unit" class="py-12 text-center">
      <p class="text-muted-foreground">Unidad no encontrada</p>
      <Button variant="outline" class="mt-4" @click="router.push('/admin/unidades')">
        Volver a unidades
      </Button>
    </div>

    <!-- Form -->
    <Card v-else>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Error -->
          <ErrorAlert v-if="error" :message="error" />

          <!-- Numero | Etiqueta | Estado — una fila -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <!-- Numero -->
            <div class="space-y-1.5">
              <Label for="unit-number">Numero <span class="text-destructive">*</span></Label>
              <Input
                id="unit-number"
                v-model="form.number"
                placeholder="R-001"
                required
                class="h-12 text-base"
              />
            </div>

            <!-- Etiqueta -->
            <div class="space-y-1.5">
              <Label for="unit-label">Etiqueta</Label>
              <Input
                id="unit-label"
                v-model="form.label"
                placeholder="Nombre descriptivo"
                class="h-12 text-base"
              />
            </div>

            <!-- Estado -->
            <div class="space-y-1.5">
              <Label>Estado</Label>
              <div class="flex gap-2">
                <Button
                  type="button"
                  :variant="form.isActive ? 'default' : 'outline'"
                  class="h-12 flex-1"
                  @click="form.isActive = true"
                >
                  Activa
                </Button>
                <Button
                  type="button"
                  :variant="!form.isActive ? 'default' : 'outline'"
                  class="h-12 flex-1"
                  @click="form.isActive = false"
                >
                  Inactiva
                </Button>
              </div>
            </div>
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Guardando...' : 'Guardar cambios' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
