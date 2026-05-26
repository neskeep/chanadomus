<script setup lang="ts">
import {
  Plus,
  Pencil,
  KeyRound,
  Ban,
  ShieldCheck,
  Users,
  Mail,
  Building2,
  Loader2,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ROLE_LABELS, USER_ROLES, type UserRole } from '~~/shared/types/auth'
import type { UserWithUnit } from '~~/shared/types/auth'

useHead({ title: 'Usuarios' })

const { userList, isLoading, isSubmitting, error, fetchUsers, toggleBan, resetPassword } = useAdminUsers()

const { target, isMounted } = useTopbarPortal()

// Filters
const selectedRole = ref<UserRole | ''>('')
const searchQuery = ref('')
const sortBy = ref('role')
// Prevent deselecting sort (TopbarFilterGroup toggles to '' on re-click)
watch(sortBy, (v) => { if (!v) sortBy.value = 'role' })

const roleOptions = USER_ROLES.map(r => ({ value: r, label: ROLE_LABELS[r] }))
const sortOptions = [
  { value: 'role', label: 'Rol + nombre' },
  { value: 'name', label: 'Nombre A-Z' },
  { value: 'unit', label: 'Unidad' },
]

const ROLE_BADGE: Record<UserRole, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  admin: { label: 'Admin', variant: 'default' },
  propietario: { label: 'Propietario', variant: 'secondary' },
  conserje: { label: 'Conserje', variant: 'outline' },
  vigilancia: { label: 'Vigilancia', variant: 'outline' },
}

const ROLE_ORDER: Record<UserRole, number> = {
  admin: 0,
  conserje: 1,
  vigilancia: 2,
  propietario: 3,
}

// Filtered + sorted list
const filteredUsers = computed(() => {
  let list = userList.value
  if (selectedRole.value) {
    list = list.filter(u => u.role === selectedRole.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(u =>
      u.name.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q),
    )
  }
  return [...list].sort((a, b) => {
    if (sortBy.value === 'name') {
      return a.name.localeCompare(b.name, 'es')
    }
    if (sortBy.value === 'unit') {
      const aUnit = a.unitNumber ?? ''
      const bUnit = b.unitNumber ?? ''
      return aUnit.localeCompare(bUnit, 'es') || a.name.localeCompare(b.name, 'es')
    }
    // Default: role priority + alphabetical
    const roleDiff = ROLE_ORDER[a.role] - ROLE_ORDER[b.role]
    if (roleDiff !== 0) return roleDiff
    return a.name.localeCompare(b.name, 'es')
  })
})

// Password Dialog
const passwordDialogOpen = ref(false)
const passwordUser = ref<UserWithUnit | null>(null)
const newPassword = ref('')

function openPasswordDialog(user: UserWithUnit) {
  passwordUser.value = user
  newPassword.value = ''
  passwordDialogOpen.value = true
}

async function handleResetPassword() {
  if (!passwordUser.value || newPassword.value.length < 8) return
  try {
    await resetPassword(passwordUser.value.id, newPassword.value)
    toast.success('Contraseña actualizada correctamente')
    passwordDialogOpen.value = false
  }
  catch {
    toast.error(error.value ?? 'Error al cambiar contraseña')
  }
}

// Ban Dialog
const banDialogOpen = ref(false)
const banUser = ref<UserWithUnit | null>(null)
const banReason = ref('')

function openBanDialog(user: UserWithUnit) {
  banUser.value = user
  banReason.value = ''
  banDialogOpen.value = true
}

async function handleToggleBan() {
  if (!banUser.value) return
  try {
    await toggleBan(banUser.value.id, !banUser.value.banned, banUser.value.banned ? undefined : banReason.value.trim() || undefined)
    toast.success(banUser.value.banned ? 'Usuario reactivado' : 'Usuario suspendido')
    banDialogOpen.value = false
  }
  catch {
    toast.error(error.value ?? 'Error al cambiar estado')
  }
}

function getUnitDisplay(user: UserWithUnit): string {
  if (!user.unitNumber) return '—'
  return user.unitLabel || user.unitNumber
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div>
    <Teleport :to="target" defer v-if="isMounted">
      <TopbarSearch v-model="searchQuery" placeholder="Buscar usuarios...">
        <TopbarFilters :active="selectedRole !== '' || sortBy !== 'role'" @clear="selectedRole = ''; sortBy = 'role'">
          <TopbarFilterGroup v-model="selectedRole" label="Rol" :options="roleOptions" />
          <TopbarFilterGroup v-model="sortBy" label="Ordenar por" :options="sortOptions" />
        </TopbarFilters>
      </TopbarSearch>
      <NuxtLink to="/admin/usuarios/crear">
        <Button size="sm">
          <Plus class="mr-1.5 size-3.5" />
          Nuevo
        </Button>
      </NuxtLink>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" as-child>
        <NuxtLink to="/admin/usuarios/crear">
          <Plus class="size-4" />
        </NuxtLink>
      </Button>
    </TopbarMobileAction>

    <!-- Mobile search -->
    <div class="mb-4 md:hidden">
      <TopbarSearch v-model="searchQuery" placeholder="Buscar usuarios...">
        <TopbarFilters :active="selectedRole !== '' || sortBy !== 'role'" @clear="selectedRole = ''; sortBy = 'role'">
          <TopbarFilterGroup v-model="selectedRole" label="Rol" :options="roleOptions" />
          <TopbarFilterGroup v-model="sortBy" label="Ordenar por" :options="sortOptions" />
        </TopbarFilters>
      </TopbarSearch>
    </div>

    <!-- Error -->
    <ErrorAlert v-if="error && !isSubmitting" :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="6" variant="row" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="filteredUsers.length === 0"
      :icon="Users"
      title="No hay usuarios registrados"
      :description="selectedRole ? 'Prueba cambiando el filtro de rol' : 'Agrega usuarios al sistema'"
    />

    <!-- Table (desktop) / Cards (mobile) -->
    <div v-else>
      <!-- Desktop table -->
      <div class="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead class="w-[140px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="user in filteredUsers"
              :key="user.id"
              :class="{ 'opacity-60': user.banned }"
            >
              <TableCell class="font-medium">
                <NuxtLink :to="`/admin/usuarios/${user.id}`" class="hover:underline">
                  {{ user.name }}
                </NuxtLink>
              </TableCell>
              <TableCell class="text-muted-foreground">{{ user.email }}</TableCell>
              <TableCell>
                <Badge :variant="ROLE_BADGE[user.role].variant">
                  {{ ROLE_BADGE[user.role].label }}
                </Badge>
              </TableCell>
              <TableCell class="text-muted-foreground">{{ getUnitDisplay(user) }}</TableCell>
              <TableCell>
                <Badge v-if="user.banned" variant="destructive">Suspendido</Badge>
                <span v-else class="text-muted-foreground">Activo</span>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-10"
                    aria-label="Editar usuario"
                    as-child
                  >
                    <NuxtLink :to="`/admin/usuarios/${user.id}`">
                      <Pencil class="size-4" />
                    </NuxtLink>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-10"
                    aria-label="Cambiar contraseña"
                    @click="openPasswordDialog(user)"
                  >
                    <KeyRound class="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-10"
                    :class="user.banned ? 'text-primary hover:text-primary' : 'text-destructive hover:text-destructive'"
                    :aria-label="user.banned ? 'Reactivar usuario' : 'Suspender usuario'"
                    @click="openBanDialog(user)"
                  >
                    <ShieldCheck v-if="user.banned" class="size-4" />
                    <Ban v-else class="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile cards -->
      <div class="space-y-2 md:hidden">
        <Card v-for="user in filteredUsers" :key="user.id" :class="{ 'opacity-60': user.banned }">
          <CardContent class="px-3 py-2.5">
            <!-- Row 1: Name + Role badge + Banned badge -->
            <div class="flex items-center gap-1.5">
              <NuxtLink :to="`/admin/usuarios/${user.id}`" class="min-w-0 flex-1 truncate text-sm font-semibold hover:underline">
                {{ user.name }}
              </NuxtLink>
              <Badge v-if="user.banned" variant="destructive" class="shrink-0 text-[11px]">
                Suspendido
              </Badge>
              <Badge :variant="ROLE_BADGE[user.role].variant" class="shrink-0 text-[11px]">
                {{ ROLE_BADGE[user.role].label }}
              </Badge>
            </div>
            <!-- Row 2: Email · Unit | Actions inline -->
            <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
              <Mail class="size-3 shrink-0" />
              <span class="truncate">{{ user.email }}</span>
              <template v-if="user.unitNumber">
                <span class="opacity-30">·</span>
                <Building2 class="size-3 shrink-0" />
                <span class="shrink-0">{{ user.unitLabel || user.unitNumber }}</span>
              </template>
              <span class="ml-auto flex shrink-0 items-center gap-0.5">
                <NuxtLink
                  :to="`/admin/usuarios/${user.id}`"
                  class="inline-flex h-6 items-center px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  aria-label="Editar usuario"
                >
                  <Pencil class="size-3" />
                </NuxtLink>
                <Button
                  variant="ghost"
                  class="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  aria-label="Cambiar contraseña"
                  @click="openPasswordDialog(user)"
                >
                  <KeyRound class="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  class="h-6 px-2 text-[11px]"
                  :class="user.banned ? 'text-primary hover:text-primary' : 'text-destructive hover:text-destructive'"
                  :aria-label="user.banned ? 'Reactivar usuario' : 'Suspender usuario'"
                  @click="openBanDialog(user)"
                >
                  <ShieldCheck v-if="user.banned" class="size-3" />
                  <Ban v-else class="size-3" />
                </Button>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Password Dialog -->
    <Dialog v-model:open="passwordDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Nueva contraseña para {{ passwordUser?.name }}
          </DialogDescription>
        </DialogHeader>

        <form class="space-y-4" @submit.prevent="handleResetPassword">
          <div class="space-y-2">
            <Label for="new-password">Nueva contraseña</Label>
            <Input
              id="new-password"
              v-model="newPassword"
              type="password"
              placeholder="Nueva contraseña (mín. 8 caracteres)"
              class="h-12"
            />
          </div>

          <DialogFooter class="gap-2 sm:gap-0">
            <Button type="button" variant="outline" @click="passwordDialogOpen = false">
              Cancelar
            </Button>
            <Button
              type="submit"
              :disabled="newPassword.length < 8 || isSubmitting"
            >
              <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
              {{ isSubmitting ? 'Cambiando...' : 'Cambiar Contraseña' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Ban/Unban AlertDialog -->
    <AlertDialog v-model:open="banDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {{ banUser?.banned ? 'Reactivar usuario' : 'Suspender usuario' }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {{ banUser?.banned
              ? `¿Estás seguro de reactivar a ${banUser?.name}? Podrá acceder al sistema nuevamente.`
              : `¿Estás seguro de suspender a ${banUser?.name}? No podrá acceder al sistema.`
            }}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <!-- Ban reason (only when banning) -->
        <div v-if="banUser && !banUser.banned" class="space-y-2">
          <Label for="ban-reason">Razón (opcional)</Label>
          <Textarea
            id="ban-reason"
            v-model="banReason"
            placeholder="Motivo de la suspensión..."
            rows="3"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            :class="banUser?.banned
              ? ''
              : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'"
            :disabled="isSubmitting"
            @click="handleToggleBan"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ banUser?.banned ? 'Reactivar' : 'Suspender' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
