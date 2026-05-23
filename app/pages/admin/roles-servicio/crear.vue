<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'default' })
useHead({ title: 'Nuevo Rol de Servicio' })

const router = useRouter()

const formName = ref('')
const formDescription = ref('')
const formDisplayOrder = ref(0)
const isSubmitting = ref(false)

const canSubmit = computed(() =>
  formName.value.trim().length > 0 && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  isSubmitting.value = true
  try {
    await $fetch('/api/admin/service-roles', {
      method: 'POST',
      body: {
        name: formName.value.trim(),
        description: formDescription.value.trim() || null,
        displayOrder: formDisplayOrder.value,
      },
    })
    toast.success('Rol creado correctamente')
    router.push('/admin/roles-servicio')
  }
  catch {
    toast.error('Error al crear el rol')
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div>
    <Card>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Nombre -->
          <div class="space-y-1.5">
            <Label for="role-name">Nombre del rol <span class="text-destructive">*</span></Label>
            <Input
              id="role-name"
              v-model="formName"
              placeholder="Ej: Jardinero, Electricista, Plomero..."
              class="h-12 text-base"
              required
              autofocus
            />
          </div>

          <!-- Descripción -->
          <div class="space-y-1.5">
            <Label for="role-description">Descripción</Label>
            <Textarea
              id="role-description"
              v-model="formDescription"
              placeholder="Descripción opcional del rol..."
              class="min-h-20 text-base"
            />
          </div>

          <!-- Orden de visualización -->
          <div class="space-y-1.5">
            <Label for="role-order">Orden de visualización</Label>
            <Input
              id="role-order"
              v-model.number="formDisplayOrder"
              type="number"
              min="0"
              placeholder="0"
              class="h-12 text-base"
            />
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Creando...' : 'Crear Rol' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
