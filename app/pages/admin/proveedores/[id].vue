<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { UpdateProvider } from '~~/shared/types/provider'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const {
  isLoading,
  isSubmitting,
  error,
  fetchProvider,
  updateProvider,
} = useProviders()
const { roles: serviceRoles, fetchRoles } = useServiceRoles()

useHead({ title: 'Editar Proveedor' })

// --- Form state ---
const formName = ref('')
const formPhone = ref('')
const formServiceRoleId = ref('')
const formAddress = ref('')
const formSchedule = ref('')
const formServices = ref('')
const formCosts = ref('')
const formNotes = ref('')
const loaded = ref(false)

const canSubmit = computed(() =>
  formName.value.trim().length > 0 && !isSubmitting.value,
)

async function loadProvider() {
  try {
    const provider = await fetchProvider(id)
    formName.value = provider.name
    formPhone.value = provider.phone ?? ''
    formServiceRoleId.value = provider.serviceRoleId ?? ''
    formAddress.value = provider.address ?? ''
    formSchedule.value = provider.schedule ?? ''
    formServices.value = provider.services?.join('\n') ?? ''
    formCosts.value = provider.costs ?? ''
    formNotes.value = provider.notes ?? ''
    loaded.value = true
  }
  catch {
    // error is set by composable
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    const services = formServices.value.trim()
      ? formServices.value.trim().split('\n').filter(Boolean)
      : undefined

    const data: UpdateProvider = {
      name: formName.value.trim(),
      phone: formPhone.value.trim() || null,
      serviceRoleId: formServiceRoleId.value || null,
      address: formAddress.value.trim() || null,
      schedule: formSchedule.value.trim() || null,
      services: services ?? null,
      costs: formCosts.value.trim() || null,
      notes: formNotes.value.trim() || null,
    }
    await updateProvider(id, data)
    toast.success('Proveedor actualizado correctamente')
    router.push('/admin/proveedores')
  }
  catch {
    toast.error(error.value ?? 'Error al guardar proveedor')
  }
}

onMounted(() => {
  Promise.all([loadProvider(), fetchRoles()])
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading && !loaded" class="space-y-4">
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-24 w-full" />
    </div>

    <!-- Error -->
    <ErrorAlert v-else-if="error && !loaded" :message="error" />

    <!-- Form -->
    <Card v-else>
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
              <Label>Categoría <span class="text-destructive">*</span></Label>
              <ServiceRoleCombobox
                v-model="formServiceRoleId"
                :roles="serviceRoles"
                required
                @create="(r) => serviceRoles.push(r)"
              />
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
            {{ isSubmitting ? 'Guardando...' : 'Guardar cambios' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
