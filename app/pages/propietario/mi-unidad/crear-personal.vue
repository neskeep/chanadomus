<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

useHead({ title: 'Agregar Personal' })

const router = useRouter()
const { serviceRoles, isSubmitting, error, createServiceStaff, fetchServiceRoles, generateStaffPass } = useMyUnit()

const formName = ref('')
const formRoleId = ref('')
const formDocument = ref('')
const formPhone = ref('')

const canSubmit = computed(() =>
  formName.value.trim().length > 0
  && formRoleId.value !== ''
  && formDocument.value.trim().length > 0
  && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    const staff = await createServiceStaff({
      name: formName.value.trim(),
      roleId: formRoleId.value,
      idDocument: formDocument.value.trim() || undefined,
      phone: formPhone.value.trim() || undefined,
    })
    // Auto-generate QR pass
    try {
      await generateStaffPass(staff.id)
    }
    catch {
      // Non-blocking: pass generation failure shouldn't prevent creation
    }
    toast.success('Personal registrado con pase QR')
    router.push(`/propietario/mi-unidad/editar-personal/${staff.id}`)
  }
  catch {
    toast.error(error.value ?? 'Error al guardar')
  }
}

onMounted(() => fetchServiceRoles())
</script>

<template>
  <div>
    <Card>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <ErrorAlert v-if="error" :message="error" />

          <div class="space-y-1.5">
            <Label for="staff-name">Nombre completo <span class="text-destructive">*</span></Label>
            <Input
              id="staff-name"
              v-model="formName"
              placeholder="Nombre completo"
              class="h-12 text-base"
              required
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="staff-role">Rol <span class="text-destructive">*</span></Label>
              <Select v-model="formRoleId">
                <SelectTrigger id="staff-role" size="lg" class="text-base">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="role in serviceRoles" :key="role.id" :value="role.id">
                    {{ role.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1.5">
              <Label for="staff-document">Cédula <span class="text-destructive">*</span></Label>
              <Input
                id="staff-document"
                v-model="formDocument"
                placeholder="V-12345678"
                class="h-12 text-base"
                required
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label for="staff-phone">Teléfono</Label>
            <Input
              id="staff-phone"
              v-model="formPhone"
              placeholder="0412-1234567"
              type="tel"
              class="h-12 text-base"
            />
          </div>

          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Guardando...' : 'Agregar Personal' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
