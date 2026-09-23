<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

useHead({ title: 'Sugerir Proveedor' })

const router = useRouter()
const { isSubmitting, error, suggestProvider } = useProviders()
const { categories, fetchCategories } = useProviderCategories()

const formName = ref('')
const formPhone = ref('')
const formServiceRoleId = ref('')
const formNote = ref('')

onMounted(() => {
  fetchCategories()
})

const canSubmit = computed(() =>
  formName.value.trim().length > 0
  && formServiceRoleId.value
  && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    await suggestProvider({
      name: formName.value.trim(),
      phone: formPhone.value.trim() || undefined,
      category: 'otro',
      serviceRoleId: formServiceRoleId.value,
      notes: formNote.value.trim() || undefined,
    })
    toast.success('Sugerencia enviada. El administrador la revisará.')
    router.push('/mi-chana/proveedores')
  }
  catch {
    toast.error(error.value ?? 'Error al enviar sugerencia')
  }
}
</script>

<template>
  <div>
    <Card>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <ErrorAlert v-if="error" :message="error" />

          <!-- Nombre -->
          <div class="space-y-1.5">
            <Label for="suggest-name">Nombre <span class="text-destructive">*</span></Label>
            <Input
              id="suggest-name"
              v-model="formName"
              placeholder="Nombre del proveedor"
              class="h-12 text-base"
              required
            />
          </div>

          <!-- Teléfono + Categoría row -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="suggest-phone">Teléfono</Label>
              <Input
                id="suggest-phone"
                v-model="formPhone"
                placeholder="0412-1234567"
                class="h-12 text-base"
              />
            </div>
            <div class="space-y-1.5">
              <Label>Categoría <span class="text-destructive">*</span></Label>
              <ServiceRoleCombobox
                v-model="formServiceRoleId"
                :roles="categories"
                :creatable="false"
                required
              />
            </div>
          </div>

          <!-- Nota -->
          <div class="space-y-1.5">
            <Label for="suggest-note">Nota</Label>
            <Textarea
              id="suggest-note"
              v-model="formNote"
              placeholder="¿Por qué recomiendas este proveedor?"
              rows="3"
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
            {{ isSubmitting ? 'Enviando...' : 'Enviar Sugerencia' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
