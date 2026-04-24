<script setup lang="ts">
import {
  Search,
  Star,
  Phone,
  Plus,
  Pencil,
  Trash2,
  Wrench,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type {
  Provider,
  ProviderCategory,
  ProviderStatus,
  CreateProvider,
  UpdateProvider,
} from '~~/shared/types/provider'
import { PROVIDER_CATEGORIES } from '~~/shared/types/provider'

useHead({ title: 'Gestion de Proveedores' })

const {
  providers,
  meta,
  isLoading,
  isSubmitting,
  error,
  totalPages,
  fetchProviders,
  createProvider,
  updateProvider,
  deleteProvider,
} = useProviders()

// Filters & pagination
const currentPage = ref(1)
const searchQuery = ref('')
const filterCategory = ref<ProviderCategory | 'all'>('all')
const filterStatus = ref<ProviderStatus | 'all'>('all')
const showFilters = ref(false)

// Create/Edit dialog
const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const formName = ref('')
const formPhone = ref('')
const formCategory = ref<ProviderCategory>('otro')
const formAddress = ref('')
const formSchedule = ref('')
const formServices = ref('')
const formCosts = ref('')
const formNotes = ref('')

// Delete dialog
const deleteId = ref<string | null>(null)
const deleteDialogOpen = ref(false)

const CATEGORY_COLORS: Record<ProviderCategory, string> = {
  plomeria: 'bg-blue-100 text-blue-700',
  electricidad: 'bg-yellow-100 text-yellow-700',
  jardineria: 'bg-green-100 text-green-700',
  cerrajeria: 'bg-gray-100 text-gray-700',
  limpieza: 'bg-cyan-100 text-cyan-700',
  pintura: 'bg-purple-100 text-purple-700',
  albanileria: 'bg-orange-100 text-orange-700',
  seguridad: 'bg-red-100 text-red-700',
  fumigacion: 'bg-emerald-100 text-emerald-700',
  otro: 'bg-slate-100 text-slate-700',
}

const CATEGORY_LABELS: Record<ProviderCategory, string> = {
  plomeria: 'Plomeria',
  electricidad: 'Electricidad',
  jardineria: 'Jardineria',
  cerrajeria: 'Cerrajeria',
  limpieza: 'Limpieza',
  pintura: 'Pintura',
  albanileria: 'Albanileria',
  seguridad: 'Seguridad',
  fumigacion: 'Fumigacion',
  otro: 'Otro',
}

const STATUS_CONFIG: Record<ProviderStatus, { label: string; class: string }> = {
  active: { label: 'Activo', class: 'bg-emerald-100 text-emerald-800' },
  inactive: { label: 'Inactivo', class: 'bg-zinc-100 text-zinc-600' },
  pending: { label: 'Pendiente', class: 'bg-amber-100 text-amber-800' },
}

// Stats
const totalActive = computed(() => providers.value.filter(p => p.status === 'active').length)
const totalPending = computed(() => providers.value.filter(p => p.status === 'pending').length)

// Client-side search filter
const filteredProviders = computed(() => {
  if (!searchQuery.value.trim()) return providers.value
  const q = searchQuery.value.trim().toLowerCase()
  return providers.value.filter(p =>
    p.name.toLowerCase().includes(q)
    || p.phone?.toLowerCase().includes(q)
    || p.category.toLowerCase().includes(q),
  )
})

// Pending suggestions
const pendingSuggestions = computed(() =>
  providers.value.filter(p => p.status === 'pending'),
)

async function loadProviders() {
  const params: { page?: number; category?: ProviderCategory; status?: ProviderStatus } = {
    page: currentPage.value,
  }
  if (filterCategory.value && filterCategory.value !== 'all') params.category = filterCategory.value
  if (filterStatus.value && filterStatus.value !== 'all') params.status = filterStatus.value
  await fetchProviders(params)
}

watch([currentPage, filterCategory, filterStatus], () => {
  loadProviders()
})

onMounted(() => {
  loadProviders()
})

function resetForm() {
  formName.value = ''
  formPhone.value = ''
  formCategory.value = 'otro'
  formAddress.value = ''
  formSchedule.value = ''
  formServices.value = ''
  formCosts.value = ''
  formNotes.value = ''
}

function openCreateDialog() {
  editingId.value = null
  resetForm()
  dialogOpen.value = true
}

function openEditDialog(provider: Provider) {
  editingId.value = provider.id
  formName.value = provider.name
  formPhone.value = provider.phone ?? ''
  formCategory.value = provider.category
  formAddress.value = provider.address ?? ''
  formSchedule.value = provider.schedule ?? ''
  formServices.value = provider.services?.join('\n') ?? ''
  formCosts.value = provider.costs ?? ''
  formNotes.value = provider.notes ?? ''
  dialogOpen.value = true
}

const canSubmit = computed(() =>
  formName.value.trim().length > 0 && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    const services = formServices.value.trim()
      ? formServices.value.trim().split('\n').filter(Boolean)
      : undefined

    if (editingId.value) {
      const data: UpdateProvider = {
        name: formName.value.trim(),
        phone: formPhone.value.trim() || null,
        category: formCategory.value,
        address: formAddress.value.trim() || null,
        schedule: formSchedule.value.trim() || null,
        services: services ?? null,
        costs: formCosts.value.trim() || null,
        notes: formNotes.value.trim() || null,
      }
      await updateProvider(editingId.value, data)
      toast.success('Proveedor actualizado')
    }
    else {
      const data: CreateProvider = {
        name: formName.value.trim(),
        phone: formPhone.value.trim() || undefined,
        category: formCategory.value,
        address: formAddress.value.trim() || undefined,
        schedule: formSchedule.value.trim() || undefined,
        services,
        costs: formCosts.value.trim() || undefined,
        notes: formNotes.value.trim() || undefined,
      }
      await createProvider(data)
      toast.success('Proveedor creado')
    }
    dialogOpen.value = false
    await loadProviders()
  }
  catch {
    toast.error(error.value ?? 'Error al guardar proveedor')
  }
}

function confirmDelete(id: string) {
  deleteId.value = id
  deleteDialogOpen.value = true
}

async function handleDelete() {
  if (!deleteId.value) return
  try {
    await deleteProvider(deleteId.value)
    toast.success('Proveedor eliminado')
    deleteDialogOpen.value = false
    deleteId.value = null
    await loadProviders()
  }
  catch {
    toast.error(error.value ?? 'Error al eliminar proveedor')
  }
}

async function handleApprove(id: string) {
  try {
    await updateProvider(id, { status: 'active' })
    toast.success('Proveedor aprobado')
    await loadProviders()
  }
  catch {
    toast.error(error.value ?? 'Error al aprobar proveedor')
  }
}

async function handleReject(id: string) {
  try {
    await deleteProvider(id)
    toast.success('Sugerencia rechazada')
    await loadProviders()
  }
  catch {
    toast.error(error.value ?? 'Error al rechazar sugerencia')
  }
}

async function handleToggleStatus(provider: Provider) {
  const newStatus: ProviderStatus = provider.status === 'active' ? 'inactive' : 'active'
  try {
    await updateProvider(provider.id, { status: newStatus })
    toast.success(`Proveedor ${newStatus === 'active' ? 'activado' : 'desactivado'}`)
    await loadProviders()
  }
  catch {
    toast.error(error.value ?? 'Error al cambiar estado')
  }
}

function renderStars(rating: number | undefined): number[] {
  const r = Math.round(rating ?? 0)
  return [1, 2, 3, 4, 5].map(i => (i <= r ? 1 : 0))
}
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <!-- Header -->
    <div class="mb-6 flex justify-end">
      <Button @click="openCreateDialog">
        <Plus class="mr-1.5 size-4" />
        Nuevo Proveedor
      </Button>
    </div>

    <!-- Stats cards -->
    <div class="mb-6 grid grid-cols-2 gap-2">
      <div class="flex items-center gap-3 rounded-lg border bg-card p-3">
        <div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-100">
          <Wrench class="size-4 text-emerald-600" />
        </div>
        <div>
          <p v-if="isLoading"><Skeleton class="h-5 w-8" /></p>
          <p v-else class="text-lg font-bold leading-none">{{ totalActive }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">Activos</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-lg border bg-card p-3">
        <div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-100">
          <CheckCircle2 class="size-4 text-amber-600" />
        </div>
        <div>
          <p v-if="isLoading"><Skeleton class="h-5 w-8" /></p>
          <p v-else class="text-lg font-bold leading-none">{{ totalPending }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">Pendientes</p>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      role="alert"
      class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <!-- Pending suggestions -->
    <div v-if="pendingSuggestions.length > 0" class="mb-6">
      <h2 class="mb-3 text-sm font-semibold">Sugerencias pendientes</h2>
      <div class="space-y-2">
        <Card v-for="sug in pendingSuggestions" :key="sug.id">
          <CardContent class="flex items-center justify-between gap-3 p-4">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium">{{ sug.name }}</p>
              <div class="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="CATEGORY_COLORS[sug.category]"
                >
                  {{ CATEGORY_LABELS[sug.category] }}
                </span>
                <span v-if="sug.phone" class="text-xs text-muted-foreground">{{ sug.phone }}</span>
                <span v-if="sug.createdByName" class="text-xs text-muted-foreground">
                  por {{ sug.createdByName }}
                </span>
              </div>
              <p v-if="sug.notes" class="mt-1 text-xs text-muted-foreground">{{ sug.notes }}</p>
            </div>
            <div class="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                class="size-10 text-emerald-600"
                title="Aprobar"
                @click="handleApprove(sug.id)"
              >
                <CheckCircle2 class="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="size-10 text-destructive hover:text-destructive"
                title="Rechazar"
                @click="handleReject(sug.id)"
              >
                <Trash2 class="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Search & filters -->
    <div class="mb-4 space-y-3">
      <div class="flex gap-2">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Buscar por nombre, telefono..."
            class="h-12 pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          :class="{ 'border-primary text-primary': showFilters }"
          @click="showFilters = !showFilters"
        >
          <Filter class="size-4" />
        </Button>
      </div>

      <!-- Filter selects -->
      <div v-if="showFilters" class="grid grid-cols-2 gap-3">
        <Select v-model="filterCategory">
          <SelectTrigger class="h-12">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem v-for="cat in PROVIDER_CATEGORIES" :key="cat.key" :value="cat.key">
              {{ cat.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="filterStatus">
          <SelectTrigger class="h-12">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-2">
      <Skeleton v-for="i in 5" :key="i" class="h-16 w-full rounded-lg" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filteredProviders.length === 0"
      class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"
    >
      <div class="flex size-12 items-center justify-center rounded-full bg-muted">
        <Wrench class="size-6 text-muted-foreground" />
      </div>
      <div>
        <p class="font-medium">No hay proveedores</p>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ filterCategory !== 'all' || filterStatus !== 'all' ? 'Prueba cambiando los filtros' : 'Crea el primer proveedor del directorio' }}
        </p>
      </div>
      <Button @click="openCreateDialog">
        <Plus class="mr-1.5 size-4" />
        Nuevo Proveedor
      </Button>
    </div>

    <!-- Table (desktop) / Cards (mobile) -->
    <div v-else>
      <!-- Desktop table -->
      <div class="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Telefono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in filteredProviders" :key="item.id">
              <TableCell>
                <NuxtLink
                  :to="`/mi-chana/proveedores/${item.id}`"
                  class="font-medium text-primary underline-offset-2 hover:underline"
                >
                  {{ item.name }}
                </NuxtLink>
              </TableCell>
              <TableCell>
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="CATEGORY_COLORS[item.category]"
                >
                  {{ CATEGORY_LABELS[item.category] }}
                </span>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1">
                  <Star
                    v-for="(filled, idx) in renderStars(item.averageRating)"
                    :key="idx"
                    class="size-3"
                    :class="filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'"
                  />
                  <span class="ml-1 text-xs text-muted-foreground">({{ item.reviewCount ?? 0 }})</span>
                </div>
              </TableCell>
              <TableCell class="text-muted-foreground">
                {{ item.phone ?? '—' }}
              </TableCell>
              <TableCell>
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="STATUS_CONFIG[item.status].class"
                >
                  {{ STATUS_CONFIG[item.status].label }}
                </span>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-10"
                    :title="item.status === 'active' ? 'Desactivar' : 'Activar'"
                    @click="handleToggleStatus(item)"
                  >
                    <CheckCircle2
                      class="size-4"
                      :class="item.status === 'active' ? 'text-emerald-600' : 'text-muted-foreground'"
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-10"
                    title="Editar"
                    @click="openEditDialog(item)"
                  >
                    <Pencil class="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-10 text-destructive hover:text-destructive"
                    title="Eliminar"
                    @click="confirmDelete(item.id)"
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
        <Card v-for="item in filteredProviders" :key="item.id">
          <CardContent class="p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <NuxtLink
                  :to="`/mi-chana/proveedores/${item.id}`"
                  class="text-sm font-medium leading-snug text-primary underline-offset-2 hover:underline"
                >
                  {{ item.name }}
                </NuxtLink>
                <div class="mt-1 flex items-center gap-1">
                  <Star
                    v-for="(filled, idx) in renderStars(item.averageRating)"
                    :key="idx"
                    class="size-3"
                    :class="filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'"
                  />
                  <span class="ml-1 text-xs text-muted-foreground">({{ item.reviewCount ?? 0 }})</span>
                </div>
              </div>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                :class="CATEGORY_COLORS[item.category]"
              >
                {{ CATEGORY_LABELS[item.category] }}
              </span>
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                :class="STATUS_CONFIG[item.status].class"
              >
                {{ STATUS_CONFIG[item.status].label }}
              </span>
              <span v-if="item.phone" class="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Phone class="size-3" />
                {{ item.phone }}
              </span>
            </div>
            <div class="mt-3 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                class="size-10"
                :title="item.status === 'active' ? 'Desactivar' : 'Activar'"
                @click="handleToggleStatus(item)"
              >
                <CheckCircle2
                  class="size-4"
                  :class="item.status === 'active' ? 'text-emerald-600' : 'text-muted-foreground'"
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="size-10"
                title="Editar"
                @click="openEditDialog(item)"
              >
                <Pencil class="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="size-10 text-destructive hover:text-destructive"
                title="Eliminar"
                @click="confirmDelete(item.id)"
              >
                <Trash2 class="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between">
        <Button
          variant="outline"
          :disabled="currentPage <= 1"
          @click="currentPage--"
        >
          <ChevronLeft class="mr-1 size-4" />
          Anterior
        </Button>
        <span class="text-sm text-muted-foreground">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <Button
          variant="outline"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          Siguiente
          <ChevronRight class="ml-1 size-4" />
        </Button>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ editingId ? 'Editar Proveedor' : 'Nuevo Proveedor' }}</DialogTitle>
          <DialogDescription>
            {{ editingId ? 'Modifica los datos del proveedor' : 'Completa los datos para agregar un proveedor' }}
          </DialogDescription>
        </DialogHeader>

        <form class="space-y-4 py-2" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="prov-name">Nombre</Label>
            <Input id="prov-name" v-model="formName" placeholder="Nombre del proveedor" class="h-12" required />
          </div>

          <div class="space-y-2">
            <Label for="prov-phone">Telefono</Label>
            <Input id="prov-phone" v-model="formPhone" placeholder="0412-1234567" class="h-12" />
          </div>

          <div class="space-y-2">
            <Label for="prov-category">Categoria</Label>
            <Select v-model="formCategory">
              <SelectTrigger id="prov-category" class="h-12">
                <SelectValue placeholder="Seleccionar categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="cat in PROVIDER_CATEGORIES" :key="cat.key" :value="cat.key">
                  {{ cat.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="prov-address">Direccion</Label>
            <Input id="prov-address" v-model="formAddress" placeholder="Direccion del proveedor" class="h-12" />
          </div>

          <div class="space-y-2">
            <Label for="prov-schedule">Horario</Label>
            <Input id="prov-schedule" v-model="formSchedule" placeholder="Lun-Vie 8:00-17:00" class="h-12" />
          </div>

          <div class="space-y-2">
            <Label for="prov-services">Servicios (uno por linea)</Label>
            <Textarea
              id="prov-services"
              v-model="formServices"
              placeholder="Reparacion de tuberias&#10;Destape de drenajes"
              rows="3"
            />
          </div>

          <div class="space-y-2">
            <Label for="prov-costs">Costos</Label>
            <Textarea id="prov-costs" v-model="formCosts" placeholder="Descripcion de costos..." rows="2" />
          </div>

          <div class="space-y-2">
            <Label for="prov-notes">Notas</Label>
            <Textarea id="prov-notes" v-model="formNotes" placeholder="Notas adicionales..." rows="2" />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" @click="dialogOpen = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="!canSubmit">
              <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
              {{ isSubmitting ? 'Guardando...' : (editingId ? 'Guardar cambios' : 'Crear proveedor') }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Delete AlertDialog -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar proveedor</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion no se puede deshacer. El proveedor y todas sus resenas seran eliminados permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="handleDelete"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
