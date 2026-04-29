<script setup lang="ts">
import {
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

useHead({ title: 'Personal' })

const { staffList, isLoading, isSubmitting, error, fetchStaff, createStaffMember, updateStaffMember, deleteStaffMember } = useStaff()

const { target, isMounted } = useTopbarPortal()

// Filters
const selectedRole = ref<StaffRole | ''>('')
const searchQuery = ref('')

const roleOptions = [
  { value: 'conserje', label: 'Conserje' },
  { value: 'vigilancia', label: 'Vigilancia' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'otro', label: 'Otro' },
]

// Dialog state
const dialogOpen = ref(false)
const editingStaff = ref<Staff | null>(null)

// Form state
const formName = ref('')
const formRole = ref<StaffRole | ''>('')
const formDocument = ref('')
const formPhone = ref('')
const formEmail = ref('')
const formShift = ref('none')

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
  formShift.value = 'none'
  dialogOpen.value = true
}

function openEditDialog(staff: Staff) {
  editingStaff.value = staff
  formName.value = staff.name
  formRole.value = staff.role
  formDocument.value = staff.idDocument ?? ''
  formPhone.value = staff.phone ?? ''
  formEmail.value = staff.email ?? ''
  formShift.value = staff.shift ?? 'none'
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
    shift: formShift.value === 'none' ? undefined : formShift.value || undefined,
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
  <div>
    <Teleport :to="target" defer v-if="isMounted">
      <TopbarSearch v-model="searchQuery" placeholder="Buscar personal...">
        <TopbarFilters :active="selectedRole !== ''" @clear="selectedRole = ''">
          <TopbarFilterGroup v-model="selectedRole" label="Rol" :options="roleOptions" />
        </TopbarFilters>
      </TopbarSearch>
      <Button size="sm" @click="openCreateDialog">
        <Plus class="mr-1.5 size-3.5" />
        Nuevo
      </Button>
    </Teleport>

    <!-- Error -->
    <ErrorAlert v-if="error && !isSubmitting" :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="4" variant="row" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="filteredStaff.length === 0"
      :icon="Users"
      title="No hay personal registrado"
      :description="selectedRole ? 'Prueba cambiando el filtro de rol' : 'Agrega miembros del personal del condominio'"
    />

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
                    class="size-10"
                    aria-label="Editar personal"
                    @click="openEditDialog(member)"
                  >
                    <Pencil class="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-10 text-destructive hover:text-destructive"
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
      <div class="space-y-2 md:hidden">
        <Card v-for="member in filteredStaff" :key="member.id">
          <CardContent class="px-3 py-2.5">
            <!-- Row 1: Name + Role badge -->
            <div class="flex items-center gap-1.5">
              <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ member.name }}</p>
              <Badge :variant="ROLE_CONFIG[member.role].variant" class="shrink-0 text-[11px]">
                {{ ROLE_CONFIG[member.role].label }}
              </Badge>
            </div>
            <!-- Row 2: Phone · Email · Shift | Actions inline -->
            <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
              <template v-if="member.phone">
                <Phone class="size-3 shrink-0" />
                <span class="shrink-0">{{ member.phone }}</span>
              </template>
              <template v-if="member.shift">
                <span class="opacity-30">·</span>
                <Clock class="size-3 shrink-0" />
                <span>{{ getShiftLabel(member.shift) }}</span>
              </template>
              <span class="ml-auto flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  class="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  aria-label="Editar personal"
                  @click="openEditDialog(member)"
                >
                  <Pencil class="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  class="h-6 px-2 text-[11px] text-destructive hover:text-destructive"
                  aria-label="Desactivar personal"
                  @click="openDeleteDialog(member)"
                >
                  <Trash2 class="size-3" />
                </Button>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Create/Edit Sheet -->
    <Sheet v-model:open="dialogOpen">
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{{ editingStaff ? 'Editar personal' : 'Agregar personal' }}</SheetTitle>
          <SheetDescription>
            {{ editingStaff ? 'Actualiza la información del miembro del personal' : 'Registra un nuevo miembro del personal del condominio' }}
          </SheetDescription>
        </SheetHeader>

        <form class="space-y-4 py-2" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="staff-name">Nombre *</Label>
            <Input
              id="staff-name"
              v-model="formName"
              placeholder="Nombre completo"
              class="h-12"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="staff-role">Rol *</Label>
            <Select v-model="formRole">
              <SelectTrigger id="staff-role" class="h-12">
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
              class="h-12"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <Label for="staff-phone">Teléfono</Label>
              <Input
                id="staff-phone"
                v-model="formPhone"
                placeholder="0412-1234567"
                class="h-12"
              />
            </div>

            <div class="space-y-2">
              <Label for="staff-email">Email</Label>
              <Input
                id="staff-email"
                v-model="formEmail"
                type="email"
                placeholder="correo@ejemplo.com"
                class="h-12"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="staff-shift">Turno</Label>
            <Select v-model="formShift">
              <SelectTrigger id="staff-shift" class="h-12">
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

          <SheetFooter class="gap-2 sm:gap-0">
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
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>

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
