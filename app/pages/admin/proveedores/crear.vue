<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { ProviderCategory, CreateProvider } from '~~/shared/types/provider'
import { PROVIDER_CATEGORIES } from '~~/shared/types/provider'

useHead({ title: 'Nuevo Proveedor' })

const router = useRouter()
const { isSubmitting, error, createProvider } = useProviders()

// --- Form state ---
const formName = ref('')
const formPhone = ref('')
const formCategory = ref<ProviderCategory>('otro')
const formAddress = ref('')
const formSchedule = ref('')
const formServices = ref('')
const formCosts = ref('')
const formNotes = ref('')

const canSubmit = computed(() =>
  formName.value.trim().length > 0
  && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    const services = formServices.value.trim()
      ? formServices.value.trim().split('\n').filter(Boolean)
      : undefined

    const data: CreateProvider = {
      name: formName.value.trim(),
      phone: formPhone.value.trim() || undefined,
      category: formCategory.value,
      address: formAddress.value.trim() || undefined,
      schedule: formSchedule.value.trim() || undefined,
      services,
      costs: formCosts.value.trim() || undefined,
      notes: formNotes.value.trim() || undefined,
    }
    await createProvider(data)
    toast.success('Proveedor creado correctamente')
    router.push('/admin/proveedores')
  }
  catch {
    toast.error(error.value ?? 'Error al crear proveedor')
  }
}
</script>

<template>
  <div>
    <Card>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Error -->
          <ErrorAlert v-if="error" :message="error" />

          <!-- Nombre -->
          <div class="space-y-1.5">
            <Label for="prov-name">Nombre <span class="text-destructive">*</span></Label>
            <Input
              id="prov-name"
              v-model="formName"
              placeholder="Nombre del proveedor"
              class="h-12 text-base"
              required
            />
          </div>

          <!-- Teléfono + Categoría row -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="prov-phone">Teléfono</Label>
              <Input
                id="prov-phone"
                v-model="formPhone"
                placeholder="0412-1234567"
                class="h-12 text-base"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="prov-category">Categoría</Label>
              <Select v-model="formCategory">
                <SelectTrigger id="prov-category" size="lg" class="text-base">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="cat in PROVIDER_CATEGORIES" :key="cat.key" :value="cat.key">
                    {{ cat.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Dirección + Horario row -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="prov-address">Dirección</Label>
              <Input
                id="prov-address"
                v-model="formAddress"
                placeholder="Dirección del proveedor"
                class="h-12 text-base"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="prov-schedule">Horario</Label>
              <Input
                id="prov-schedule"
                v-model="formSchedule"
                placeholder="Lun-Vie 8:00-17:00"
                class="h-12 text-base"
              />
            </div>
          </div>

          <!-- Servicios -->
          <div class="space-y-1.5">
            <Label for="prov-services">Servicios (uno por línea)</Label>
            <Textarea
              id="prov-services"
              v-model="formServices"
              placeholder="Reparación de tuberías&#10;Destape de drenajes"
              rows="3"
              class="text-base"
            />
          </div>

          <!-- Costos + Notas row -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="prov-costs">Costos</Label>
              <Textarea
                id="prov-costs"
                v-model="formCosts"
                placeholder="Descripción de costos..."
                rows="2"
                class="text-base"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="prov-notes">Notas</Label>
              <Textarea
                id="prov-notes"
                v-model="formNotes"
                placeholder="Notas adicionales..."
                rows="2"
                class="text-base"
              />
            </div>
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Creando...' : 'Crear Proveedor' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
