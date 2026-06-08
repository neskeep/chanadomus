<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ROLE_LABELS, USER_ROLES, type UserRole } from '~~/shared/types/auth'

useHead({ title: 'Nuevo Usuario' })

const router = useRouter()
const { isSubmitting, error, createUser } = useAdminUsers()

// Units for selector
const units = ref<Array<{ id: string; number: string; label: string | null }>>([])

async function fetchUnits() {
  try {
    const res = await $fetch<{ data: Array<{ id: string; number: string; label: string | null }> }>('/api/units')
    units.value = res.data
  }
  catch {
    // silent
  }
}

// Form state
const formName = ref('')
const formEmail = ref('')
const formPassword = ref('')
const formConfirmPassword = ref('')
const formRole = ref<string | undefined>(undefined)
const formUnitId = ref<string | undefined>(undefined)
const formPhone = ref('')
const formCedula = ref('')

const passwordMismatch = computed(() =>
  formConfirmPassword.value.length > 0
  && formPassword.value !== formConfirmPassword.value,
)

// Roles que requieren unidad obligatoria
const ROLES_REQUIRING_UNIT = ['propietario', 'conserje']
const isUnitRequired = computed(() =>
  !!formRole.value && ROLES_REQUIRING_UNIT.includes(formRole.value),
)
const showUnitField = computed(() =>
  !!formRole.value && ROLES_REQUIRING_UNIT.includes(formRole.value),
)

const canSubmit = computed(() =>
  formName.value.trim().length > 0
  && formCedula.value.trim().length > 0
  && formEmail.value.trim().length > 0
  && formPassword.value.length >= 8
  && formPassword.value === formConfirmPassword.value
  && !!formRole.value
  && (!isUnitRequired.value || (formUnitId.value !== undefined && formUnitId.value !== 'none'))
  && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    await createUser({
      name: formName.value.trim(),
      email: formEmail.value.trim(),
      password: formPassword.value,
      role: formRole.value as UserRole,
      unitId: showUnitField.value ? (formUnitId.value === 'none' ? undefined : formUnitId.value) : undefined,
      phone: formPhone.value.trim() || undefined,
      cedula: formCedula.value.trim() || undefined,
    })
    toast.success('Usuario creado correctamente')
    router.push('/admin/usuarios')
  }
  catch {
    toast.error(error.value ?? 'Error al crear usuario')
  }
}

onMounted(() => {
  fetchUnits()
})
</script>

<template>
  <div>
    <Card>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Error -->
          <ErrorAlert v-if="error" :message="error" />

          <!-- Nombre completo -->
          <div class="space-y-1.5">
            <Label for="user-name">Nombre completo <span class="text-destructive">*</span></Label>
            <Input
              id="user-name"
              v-model="formName"
              placeholder="Nombre completo"
              class="h-12 text-base"
              required
            />
          </div>

          <!-- Cédula + Correo -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="user-cedula">Cédula <span class="text-destructive">*</span></Label>
              <Input
                id="user-cedula"
                v-model="formCedula"
                placeholder="V-12345678"
                class="h-12 text-base"
                required
              />
            </div>
            <div class="space-y-1.5">
              <Label for="user-email">Correo <span class="text-destructive">*</span></Label>
              <Input
                id="user-email"
                v-model="formEmail"
                type="email"
                placeholder="correo@ejemplo.com"
                class="h-12 text-base"
                required
              />
            </div>
          </div>

          <!-- Teléfono -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="user-phone">Teléfono</Label>
              <Input
                id="user-phone"
                v-model="formPhone"
                placeholder="0412-1234567"
                class="h-12 text-base"
              />
            </div>
          </div>

          <!-- Rol + Unidad -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="user-role">Rol <span class="text-destructive">*</span></Label>
              <Select v-model="formRole">
                <SelectTrigger id="user-role" size="lg" class="text-base">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="role in USER_ROLES" :key="role" :value="role">
                    {{ ROLE_LABELS[role] }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div v-if="showUnitField" class="space-y-1.5">
              <Label>Rancho asignado <span v-if="isUnitRequired" class="text-destructive">*</span></Label>
              <UnitCombobox v-model="formUnitId" :units="units" :required="isUnitRequired" />
              <p class="text-xs text-muted-foreground">
                Este rol requiere un rancho asignado
              </p>
            </div>
          </div>

          <!-- Contraseña + Confirmar -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="user-password">Contraseña <span class="text-destructive">*</span></Label>
              <Input
                id="user-password"
                v-model="formPassword"
                type="password"
                placeholder="Mínimo 8 caracteres"
                class="h-12 text-base"
                required
              />
            </div>
            <div class="space-y-1.5">
              <Label for="user-confirm-password">Confirmar contraseña <span class="text-destructive">*</span></Label>
              <Input
                id="user-confirm-password"
                v-model="formConfirmPassword"
                type="password"
                placeholder="Repetir contraseña"
                class="h-12 text-base"
                :class="{ 'border-destructive': passwordMismatch }"
                required
              />
              <p v-if="passwordMismatch" class="text-sm text-destructive">
                Las contraseñas no coinciden
              </p>
            </div>
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Creando...' : 'Crear Usuario' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
