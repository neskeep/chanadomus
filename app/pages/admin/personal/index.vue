<script setup lang="ts">
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Shield,
  Wrench,
  User,
  Users,
  Phone,
  Mail,
  Clock,
  Loader2,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { StaffRole, Staff } from '~~/shared/types/staff'

definePageMeta({ layout: 'default' })

const { staffList, isLoading, isSubmitting, error, fetchStaff, createStaffMember, updateStaffMember, deleteStaffMember } = useStaff()

// Filters
const selectedRole = ref<StaffRole | ''>('')
const searchQuery = ref('')

// Dialog state
const dialogOpen = ref(false)
const editingStaff = ref<Staff | null>(null)

// Form state
const formName = ref('')
const formRole = ref<StaffRole | ''>('')
const formDocument = ref('')
const formPhone = ref('')
const formEmail = ref('')
const formShift = ref('')

// Delete dialog
const deleteDialogOpen = ref(false)
const staffToDelete = ref<Staff | null>(null)

const ROLE_CONFIG: Record<StaffRole, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  conserje: { label: 'Conserje', variant: 'default' },
  vigilancia: { label: 'Vigilancia', variant: 'secondary' },
  mantenimiento: { label: 'Mantenimiento', variant: 'outline' },
  otro: { label: 'Otro', variant: 'outline' },
}

const SHIFT_LABELS: Record<string, string> = {
  mañana: 'Mañana',
  tarde: 'Tarde',
  noche: 'Noche',
}

function getShiftLabel(shift: string | null): string {
  if (!shift) return '—'
  return SHIFT_LABELS[shift] ?? shift
}

const filteredStaff = computed(() => {
  if (!searchQuery.value.trim()) return staffList.value
  const q = searchQuery.value.trim().toLowerCase()
  return staffList.value.filter(s =>
    s.name.toLowerCase().includes(q)
    || s.phone?.toLowerCase().includes(q)
    || s.email?.toLowerCase().includes(q),
  )
})

function openCreateDialog() {
  editingStaff.value = null
  formName.value = ''
  formRole.value = ''
  formDocument.value = ''
  formPhone.value = ''
  formEmail.value = ''
  formShift.value = ''
  dialogOpen.value = true
}

function openEditDialog(staff: Staff) {
  editingStaff.value = staff
  formName.value = staff.name
  formRole.value = staff.role
  formDocument.value = staff.idDocument ?? ''
  formPhone.value = staff.phone ?? ''
  formEmail.value = staff.email ?? ''
  formShift.value = staff.shift ?? ''
  dialogOpen.value = true
}

function openDeleteDialog(staff: Staff) {
  staffToDelete.value = staff
  deleteDialogOpen.value = true
}

async function handleSubmit() {
  if (!formName.value.trim() || !formRole.value) return

  const data = {
    name: formName.value.trim(),
    role: formRole.value as StaffRole,
    idDocument: formDocument.value.trim() || undefined,
    phone: formPhone.value.trim() || undefined,
    email: formEmail.value.trim() || undefined,
    shift: formShift.value || undefined,
  }

  try {
    if (editingStaff.value) {
      await updateStaffMember(editingStaff.value.id, data)
      toast.success('Personal actualizado correctamente')
    }
    else {
      await createStaffMember(data)
      toast.success('Personal agregado correctamente')
    }
    dialogOpen.value = false
  }
  catch {
    toast.error(error.value ?? 'Error al guardar')
  }
}

async function handleDelete() {
  if (!staffToDelete.value) return

  try {
    await deleteStaffMember(staffToDelete.value.id)
    toast.success('Personal desactivado correctamente')
    deleteDialogOpen.value = false
  }
  catch {
    toast.error(error.value ?? 'Error al desactivar')
  }
}

watch(selectedRole, (role) => {
  fetchStaff(role || undefined)
})

onMounted(() => {
  fetchStaff()
})
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Personal</h1>
        <p class="mt-1 text-sm text-muted-foreground">Gestiona el personal del condominio</p>
      </div>
      <Button size="sm" @click="openCreateDialog">
        <Plus class="mr-1.5 size-4" />
        Agregar
      </Button>
    </div>

    <!-- Error -->
    <div
      v-if="error && !isSubmitting"
      role="alert"
      class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <!-- Filter bar -->
    <div class="mb-4 space-y-3">
      <div class="flex gap-2">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Buscar por nombre, teléfono o email..."
            class="pl-9"
          />
        </div>
        <Select v-model="selectedRole">
          <SelectTrigger class="w-[160px]">
            <SelectValue placeholder="Todos los roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="conserje">Conserje</SelectItem>
            <SelectItem value="vigilancia">Vigilancia</SelectItem>
            <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
            <SelectItem value="otro">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-2">
      <Skeleton v-for="i in 4" :key="i" class="h-16 w-full rounded-lg" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filteredStaff.length === 0"
      class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"
    >
      <div class="flex size-12 items-center justify-center rounded-full bg-muted">
        <Users class="size-6 text-muted-foreground" />
      </div>
      <div>
        <p class="font-medium">No hay personal registrado</p>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ selectedRole ? 'Prueba cambiando el filtro de rol' : 'Agrega miembros del personal del condominio' }}
        </p>
      </div>
    </div>

    <!-- Table (desktop) / Cards (mobile) -->
    <div v-else>
      <!-- Desktop table -->
      <div class="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead class="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="member in filteredStaff" :key="member.id">
              <TableCell class="font-medium">{{ member.name }}</TableCell>
              <TableCell>
                <Badge :variant="ROLE_CONFIG[member.role].variant">
                  {{ ROLE_CONFIG[member.role].label }}
                </Badge>
              </TableCell>
              <TableCell class="text-muted-foreground">{{ member.phone ?? '—' }}</TableCell>
              <TableCell class="text-muted-foreground">{{ member.email ?? '—' }}</TableCell>
              <TableCell class="text-muted-foreground">{{ getShiftLabel(member.shift) }}</TableCell>
              <TableCell>
                <div class="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8"
                    aria-label="Editar personal"
                    @click="openEditDialog(member)"
                  >
                    <Pencil class="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8 text-destructive hover:text-destructive"
                    aria-label="Desactivar personal"
                    @click="openDeleteDialog(member)"
                  >
                    <Trash2 class="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile cards -->
      <div class="space-y-3 md:hidden">
        <Card v-for="member in filteredStaff" :key="member.id">
          <CardContent class="p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium">{{ member.name }}</p>
                <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge :variant="ROLE_CONFIG[member.role].variant" class="text-xs">
                    {{ ROLE_CONFIG[member.role].label }}
                  </Badge>
                  <span v-if="member.shift" class="text-xs text-muted-foreground">
                    {{ getShiftLabel(member.shift) }}
                  </span>
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8"
                  aria-label="Editar personal"
                  @click="openEditDialog(member)"
                >
                  <Pencil class="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 text-destructive hover:text-destructive"
                  aria-label="Desactivar personal"
                  @click="openDeleteDialog(member)"
                >
                  <Trash2 class="size-4" />
                </Button>
              </div>
            </div>
            <div class="mt-2 space-y-1">
              <p v-if="member.phone" class="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone class="size-3" />
                {{ member.phone }}
              </p>
              <p v-if="member.email" class="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail class="size-3" />
                {{ member.email }}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingStaff ? 'Editar personal' : 'Agregar personal' }}</DialogTitle>
          <DialogDescription>
            {{ editingStaff ? 'Actualiza la información del miembro del personal' : 'Registra un nuevo miembro del personal del condominio' }}
          </DialogDescription>
        </DialogHeader>

        <form class="space-y-4 py-2" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="staff-name">Nombre *</Label>
            <Input
              id="staff-name"
              v-model="formName"
              placeholder="Nombre completo"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="staff-role">Rol *</Label>
            <Select v-model="formRole">
              <SelectTrigger id="staff-role">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conserje">Conserje</SelectItem>
                <SelectItem value="vigilancia">Vigilancia</SelectItem>
                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="staff-document">Documento de identidad</Label>
            <Input
              id="staff-document"
              v-model="formDocument"
              placeholder="Cédula o pasaporte"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <Label for="staff-phone">Teléfono</Label>
              <Input
                id="staff-phone"
                v-model="formPhone"
                placeholder="0412-1234567"
              />
            </div>

            <div class="space-y-2">
              <Label for="staff-email">Email</Label>
              <Input
                id="staff-email"
                v-model="formEmail"
                type="email"
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="staff-shift">Turno</Label>
            <Select v-model="formShift">
              <SelectTrigger id="staff-shift">
                <SelectValue placeholder="Seleccionar turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin asignar</SelectItem>
                <SelectItem value="mañana">Mañana</SelectItem>
                <SelectItem value="tarde">Tarde</SelectItem>
                <SelectItem value="noche">Noche</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter class="gap-2 sm:gap-0">
            <Button type="button" variant="outline" @click="dialogOpen = false">
              Cancelar
            </Button>
            <Button
              type="submit"
              :disabled="!formName.trim() || !formRole || isSubmitting"
            >
              <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
              {{ isSubmitting ? 'Guardando...' : 'Guardar' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Delete AlertDialog -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Desactivar personal</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de desactivar a {{ staffToDelete?.name }}? Esta acción se puede revertir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isSubmitting"
            @click="handleDelete"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            Desactivar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
