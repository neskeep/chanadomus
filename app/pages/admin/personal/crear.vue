<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
useHead({ title: 'Agregar Personal' })

const router = useRouter()
const { isSubmitting, error, createStaffMember, roleOptions, fetchRoles } = useStaff()

// --- Form state ---
const formName = ref('')
const formRole = ref('')
const formDocument = ref('')
const formPhone = ref('')
const formEmail = ref('')
const formShift = ref('none')

const activeRoles = computed(() => roleOptions.value.filter(r => r.isActive))

onMounted(() => {
  fetchRoles()
})

const canSubmit = computed(() =>
  formName.value.trim().length > 0
  && formRole.value !== ''
  && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    await createStaffMember({
      name: formName.value.trim(),
      roleId: formRole.value,
      idDocument: formDocument.value.trim() || undefined,
      phone: formPhone.value.trim() || undefined,
      email: formEmail.value.trim() || undefined,
      shift: formShift.value === 'none' ? undefined : formShift.value || undefined,
    })
    toast.success('Personal agregado correctamente')
    router.push('/admin/personal')
  }
  catch {
    toast.error(error.value ?? 'Error al guardar')
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

          <!-- Nombre + Cédula -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="staff-name">Nombre <span class="text-destructive">*</span></Label>
              <Input
                id="staff-name"
                v-model="formName"
                placeholder="Nombre completo"
                class="h-12 text-base"
                required
              />
            </div>
            <div class="space-y-1.5">
              <Label for="staff-document">Cédula</Label>
              <Input
                id="staff-document"
                v-model="formDocument"
                placeholder="V-12345678"
                class="h-12 text-base"
              />
            </div>
          </div>

          <!-- Teléfono + Email -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="staff-phone">Teléfono</Label>
              <Input
                id="staff-phone"
                v-model="formPhone"
                placeholder="0412-1234567"
                class="h-12 text-base"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="staff-email">Email</Label>
              <Input
                id="staff-email"
                v-model="formEmail"
                type="email"
                placeholder="correo@ejemplo.com"
                class="h-12 text-base"
              />
            </div>
          </div>

          <!-- Turno + Rol -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="staff-shift">Turno</Label>
              <Select v-model="formShift">
                <SelectTrigger id="staff-shift" size="lg" class="text-base">
                  <SelectValue placeholder="Seleccionar turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  <SelectItem value="mañana">Mañana</SelectItem>
                  <SelectItem value="tarde">Tarde</SelectItem>
                  <SelectItem value="noche">Noche</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1.5">
              <Label for="staff-role">Rol <span class="text-destructive">*</span></Label>
              <Select v-model="formRole">
                <SelectTrigger id="staff-role" size="lg" class="text-base">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="role in activeRoles" :key="role.id" :value="role.id">
                    {{ role.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Submit -->
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
