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
const formUnitId = ref('none')

// Units for selector
const unitOptions = ref<{ id: string; number: string; label: string | null }[]>([])

const activeRoles = computed(() => roleOptions.value.filter(r => r.isActive))

// Conserjes requieren unidad obligatoria
const selectedRoleName = computed(() =>
  roleOptions.value.find(r => r.id === formRole.value)?.name ?? '',
)
const isUnitRequired = computed(() =>
  selectedRoleName.value.toLowerCase() === 'conserje',
)

onMounted(async () => {
  await Promise.all([
    fetchRoles(),
    (async () => {
      try {
        const res = await $fetch<{ data: { id: string; number: string; label: string | null }[] }>('/api/units')
        unitOptions.value = res.data
      }
      catch { /* selector will be empty */ }
    })(),
  ])
})

const canSubmit = computed(() =>
  formName.value.trim().length > 0
  && formRole.value !== ''
  && (!isUnitRequired.value || (formUnitId.value !== '' && formUnitId.value !== 'none'))
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
      unitId: formUnitId.value === 'none' ? undefined : formUnitId.value || undefined,
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

          <!-- Nombre -->
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

          <!-- Rol + Documento row -->
          <div class="grid gap-4 sm:grid-cols-2">
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
            <div class="space-y-1.5">
              <Label for="staff-document">Documento de identidad</Label>
              <Input
                id="staff-document"
                v-model="formDocument"
                placeholder="Cédula o pasaporte"
                class="h-12 text-base"
              />
            </div>
          </div>

          <!-- Teléfono + Email row -->
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

          <!-- Turno + Unidad -->
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
              <Label for="staff-unit">Unidad asignada <span v-if="isUnitRequired" class="text-destructive">*</span></Label>
              <Select v-model="formUnitId">
                <SelectTrigger id="staff-unit" size="lg" class="text-base">
                  <SelectValue placeholder="Sin unidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-if="!isUnitRequired" value="none">Sin unidad</SelectItem>
                  <SelectItem
                    v-for="unit in unitOptions"
                    :key="unit.id"
                    :value="unit.id"
                  >
                    {{ unit.number }}{{ unit.label ? ` — ${unit.label}` : '' }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p v-if="isUnitRequired" class="text-xs text-muted-foreground">
                Los conserjes deben tener una unidad asignada
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
            {{ isSubmitting ? 'Guardando...' : 'Agregar Personal' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
