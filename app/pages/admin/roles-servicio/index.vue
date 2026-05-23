<script setup lang="ts">
import { Plus, Pencil, Trash2, Tag, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'default' })
useHead({ title: 'Roles de Servicio' })

const { target, isMounted } = useTopbarPortal()

// --- Types ---
interface ServiceRole {
  id: string
  name: string
  description: string | null
  isActive: boolean
  displayOrder: number
  tenantId: string
  createdAt: string
}

// --- State ---
const roles = ref<ServiceRole[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const fetchError = ref<string | null>(null)

// --- Edit Dialog ---
const editDialogOpen = ref(false)
const editingRole = ref<ServiceRole | null>(null)
const editName = ref('')
const editDescription = ref('')
const editIsActive = ref(true)
const editDisplayOrder = ref(0)

// --- Delete AlertDialog ---
const deleteDialogOpen = ref(false)
const roleToDelete = ref<ServiceRole | null>(null)

// --- Fetch ---
async function fetchRoles() {
  isLoading.value = true
  fetchError.value = null
  try {
    const res = await $fetch<{ data: ServiceRole[] }>('/api/admin/service-roles', {
      query: { includeInactive: 'true' },
    })
    roles.value = res.data
  }
  catch {
    fetchError.value = 'Error al cargar los roles de servicio'
  }
  finally {
    isLoading.value = false
  }
}

// --- Edit ---
function openEdit(role: ServiceRole) {
  editingRole.value = role
  editName.value = role.name
  editDescription.value = role.description ?? ''
  editIsActive.value = role.isActive
  editDisplayOrder.value = role.displayOrder
  editDialogOpen.value = true
}

async function handleEdit() {
  if (!editingRole.value || !editName.value.trim() || isSubmitting.value) return
  isSubmitting.value = true
  try {
    const res = await $fetch<{ data: ServiceRole }>(`/api/admin/service-roles/${editingRole.value.id}`, {
      method: 'PATCH',
      body: {
        name: editName.value.trim(),
        description: editDescription.value.trim() || null,
        isActive: editIsActive.value,
        displayOrder: editDisplayOrder.value,
      },
    })
    const idx = roles.value.findIndex(r => r.id === editingRole.value!.id)
    if (idx !== -1) roles.value[idx] = res.data
    toast.success('Rol actualizado correctamente')
    editDialogOpen.value = false
  }
  catch {
    toast.error('Error al actualizar el rol')
  }
  finally {
    isSubmitting.value = false
  }
}

// --- Delete ---
function openDelete(role: ServiceRole) {
  roleToDelete.value = role
  deleteDialogOpen.value = true
}

async function handleDelete() {
  if (!roleToDelete.value || isSubmitting.value) return
  isSubmitting.value = true
  try {
    await $fetch(`/api/admin/service-roles/${roleToDelete.value.id}`, { method: 'DELETE' })
    roles.value = roles.value.filter(r => r.id !== roleToDelete.value!.id)
    toast.success('Rol eliminado correctamente')
    deleteDialogOpen.value = false
  }
  catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode
    if (status === 409) {
      toast.error('No se puede eliminar: el rol está en uso por personal activo')
    }
    else {
      toast.error('Error al eliminar el rol')
    }
  }
  finally {
    isSubmitting.value = false
  }
}

onMounted(fetchRoles)
</script>

<template>
  <div>
    <!-- Topbar action -->
    <Teleport v-if="isMounted" :to="target" defer>
      <NuxtLink to="/admin/roles-servicio/crear">
        <Button size="sm">
          <Plus class="mr-1.5 size-3.5" />
          Agregar
        </Button>
      </NuxtLink>
    </Teleport>

    <!-- Mobile action -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" as-child>
        <NuxtLink to="/admin/roles-servicio/crear">
          <Plus class="size-4" />
        </NuxtLink>
      </Button>
    </TopbarMobileAction>

    <!-- Error -->
    <ErrorAlert v-if="fetchError && !isLoading" :message="fetchError" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="4" variant="row" />

    <!-- Empty -->
    <EmptyState
      v-else-if="roles.length === 0"
      :icon="Tag"
      title="Sin roles"
      description="Agrega roles para el personal de servicio"
    />

    <!-- Content -->
    <div v-else>
      <!-- Desktop table -->
      <div class="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead class="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="role in roles"
              :key="role.id"
              :class="{ 'opacity-50': !role.isActive }"
            >
              <TableCell class="font-medium">
                <div class="flex items-center gap-2">
                  <span>{{ role.name }}</span>
                  <Badge v-if="!role.isActive" variant="outline" class="text-[11px]">Inactivo</Badge>
                </div>
              </TableCell>
              <TableCell class="text-muted-foreground">
                {{ role.description ?? '—' }}
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-10"
                    aria-label="Editar rol"
                    @click="openEdit(role)"
                  >
                    <Pencil class="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-10 text-destructive hover:text-destructive"
                    aria-label="Eliminar rol"
                    @click="openDelete(role)"
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
        <Card
          v-for="role in roles"
          :key="role.id"
          :class="{ 'opacity-50': !role.isActive }"
        >
          <CardContent class="px-3 py-2.5">
            <!-- Row 1: Name + inactive badge -->
            <div class="flex items-center gap-1.5">
              <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ role.name }}</p>
              <Badge v-if="!role.isActive" variant="outline" class="shrink-0 text-[11px]">Inactivo</Badge>
            </div>
            <!-- Row 2: Description -->
            <p v-if="role.description" class="mt-0.5 truncate text-[11px] text-muted-foreground">
              {{ role.description }}
            </p>
            <!-- Row 3: Actions inline -->
            <div class="mt-0.5 flex items-center justify-end gap-0.5 text-[11px]">
              <Button
                variant="ghost"
                class="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                aria-label="Editar rol"
                @click="openEdit(role)"
              >
                <Pencil class="size-3" />
              </Button>
              <Button
                variant="ghost"
                class="h-6 px-2 text-[11px] text-destructive hover:text-destructive"
                aria-label="Eliminar rol"
                @click="openDelete(role)"
              >
                <Trash2 class="size-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Edit Dialog -->
    <Dialog v-model:open="editDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar rol</DialogTitle>
          <DialogDescription>
            Modifica los datos del rol de servicio
          </DialogDescription>
        </DialogHeader>

        <form class="space-y-4" @submit.prevent="handleEdit">
          <div class="space-y-1.5">
            <Label for="edit-role-name">Nombre del rol <span class="text-destructive">*</span></Label>
            <Input
              id="edit-role-name"
              v-model="editName"
              placeholder="Ej: Jardinero, Electricista..."
              class="h-12 text-base"
              required
              autofocus
            />
          </div>

          <div class="space-y-1.5">
            <Label for="edit-role-description">Descripción</Label>
            <Textarea
              id="edit-role-description"
              v-model="editDescription"
              placeholder="Descripción opcional del rol..."
              class="min-h-20 text-base"
            />
          </div>

          <div class="space-y-1.5">
            <Label for="edit-role-order">Orden de visualización</Label>
            <Input
              id="edit-role-order"
              v-model.number="editDisplayOrder"
              type="number"
              min="0"
              placeholder="0"
              class="h-12 text-base"
            />
          </div>

          <div class="flex items-center justify-between">
            <Label for="edit-role-active" class="cursor-pointer">Rol activo</Label>
            <Switch
              id="edit-role-active"
              v-model="editIsActive"
            />
          </div>

          <DialogFooter class="gap-2 sm:gap-0">
            <Button type="button" variant="outline" @click="editDialogOpen = false">
              Cancelar
            </Button>
            <Button
              type="submit"
              :disabled="!editName.trim() || isSubmitting"
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
          <AlertDialogTitle>Eliminar rol</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de eliminar el rol "{{ roleToDelete?.name }}"? Esta acción no se puede deshacer.
            Si el rol está asignado a personal activo, no podrá eliminarse.
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
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
