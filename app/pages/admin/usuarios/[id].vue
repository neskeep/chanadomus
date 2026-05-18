<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ROLE_LABELS, USER_ROLES, type UserRole } from '~~/shared/types/auth'

useHead({ title: 'Editar Usuario' })

const route = useRoute()
const router = useRouter()
const userId = route.params.id as string

const { isSubmitting, error, updateUser } = useAdminUsers()

// Units for selector
const units = ref<Array<{ id: string; number: string; label: string | null }>>([])
const isLoadingUser = ref(true)
const loadError = ref<string | null>(null)

// Form state
const formName = ref('')
const formEmail = ref('')
const formPhone = ref('')
const formRole = ref<string | undefined>(undefined)
const formUnitId = ref<string | undefined>(undefined)

async function fetchUnits() {
  try {
    const res = await $fetch<{ data: Array<{ id: string; number: string; label: string | null }> }>('/api/units')
    units.value = res.data
  }
  catch {
    // silent
  }
}

async function fetchUser() {
  isLoadingUser.value = true
  loadError.value = null
  try {
    const res = await $fetch<{ data: Array<Record<string, unknown>> }>('/api/admin/users', {
      params: { search: '' },
    })
    const found = res.data.find((u: Record<string, unknown>) => u.id === userId)
    if (!found) {
      loadError.value = 'Usuario no encontrado'
      return
    }
    formName.value = found.name as string
    formEmail.value = found.email as string
    formPhone.value = (found.phone as string) ?? ''
    formRole.value = (found.role as string) ?? undefined
    formUnitId.value = (found.unitId as string) ?? undefined
  }
  catch {
    loadError.value = 'Error al cargar usuario'
  }
  finally {
    isLoadingUser.value = false
  }
}

const canSubmit = computed(() =>
  formName.value.trim().length > 0
  && formRole.value
  && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    await updateUser(userId, {
      name: formName.value.trim(),
      email: formEmail.value.trim(),
      role: formRole.value as UserRole,
      unitId: formUnitId.value === 'none' ? null : (formUnitId.value || null),
      phone: formPhone.value.trim() || null,
    })
    toast.success('Usuario actualizado correctamente')
    router.push('/admin/usuarios')
  }
  catch {
    toast.error(error.value ?? 'Error al actualizar')
  }
}

onMounted(() => {
  fetchUser()
  fetchUnits()
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoadingUser" class="flex items-center justify-center py-12">
      <Loader2 class="size-8 animate-spin text-muted-foreground" />
    </div>

    <!-- Load error -->
    <ErrorAlert v-else-if="loadError" :message="loadError" class="mb-4" />

    <!-- Form -->
    <Card v-else>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <ErrorAlert v-if="error" :message="error" />

          <!-- Nombre -->
          <div class="space-y-1.5">
            <Label for="edit-name">Nombre completo <span class="text-destructive">*</span></Label>
            <Input
              id="edit-name"
              v-model="formName"
              placeholder="Nombre completo"
              class="h-12 text-base"
              required
            />
          </div>

          <!-- Email -->
          <div class="space-y-1.5">
            <Label for="edit-email">Email <span class="text-destructive">*</span></Label>
            <Input
              id="edit-email"
              v-model="formEmail"
              type="email"
              placeholder="correo@ejemplo.com"
              class="h-12 text-base"
              required
            />
          </div>

          <!-- Rol + Unidad -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="edit-role">Rol <span class="text-destructive">*</span></Label>
              <Select v-model="formRole">
                <SelectTrigger id="edit-role" size="lg" class="text-base">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="role in USER_ROLES" :key="role" :value="role">
                    {{ ROLE_LABELS[role] }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1.5">
              <Label for="edit-unit">Unidad</Label>
              <Select v-model="formUnitId">
                <SelectTrigger id="edit-unit" size="lg" class="text-base">
                  <SelectValue placeholder="Sin unidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin unidad</SelectItem>
                  <SelectItem v-for="unit in units" :key="unit.id" :value="unit.id">
                    {{ unit.number }}{{ unit.label ? ` (${unit.label})` : '' }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Teléfono -->
          <div class="space-y-1.5">
            <Label for="edit-phone">Teléfono</Label>
            <Input
              id="edit-phone"
              v-model="formPhone"
              placeholder="0412-1234567"
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
            {{ isSubmitting ? 'Guardando...' : 'Guardar Cambios' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
