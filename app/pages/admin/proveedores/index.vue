<script setup lang="ts">
import {
  Star,
  Phone,
  Plus,
  Pencil,
  Trash2,
  Wrench,
  Loader2,
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
const filterCategory = ref<ProviderCategory | ''>('')
const filterStatus = ref<ProviderStatus | ''>('')

const { target, isMounted } = useTopbarPortal()

const providerCategoryOptions = [
  ...PROVIDER_CATEGORIES.map(cat => ({ value: cat.key, label: cat.label })),
]

const providerStatusOptions = [
  { value: 'active' as const, label: 'Activo' },
  { value: 'pending' as const, label: 'Pendiente' },
  { value: 'inactive' as const, label: 'Inactivo' },
]

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

import { PROVIDER_CATEGORY_COLORS as CATEGORY_COLORS, PROVIDER_STATUS_COLORS, PROVIDER_STATUS_LABELS } from '~/composables/useColorMap'

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
  active: { label: PROVIDER_STATUS_LABELS.active, class: PROVIDER_STATUS_COLORS.active },
  inactive: { label: PROVIDER_STATUS_LABELS.inactive, class: PROVIDER_STATUS_COLORS.inactive },
  pending: { label: PROVIDER_STATUS_LABELS.pending, class: PROVIDER_STATUS_COLORS.pending },
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
  if (filterCategory.value) params.category = filterCategory.value
  if (filterStatus.value) params.status = filterStatus.value
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
  <div>
    <!-- Topbar actions -->
    <Teleport :to="target" defer v-if="isMounted">
      <TopbarSearch v-model="searchQuery" placeholder="Buscar proveedor...">
        <TopbarFilters :active="filterCategory !== '' || filterStatus !== ''" @clear="filterCategory = ''; filterStatus = ''">
          <TopbarFilterGroup v-model="filterCategory" label="Categoria" :options="providerCategoryOptions" />
          <TopbarFilterGroup v-model="filterStatus" label="Estado" :options="providerStatusOptions" />
        </TopbarFilters>
      </TopbarSearch>
      <Button size="sm" @click="openCreateDialog">
        <Plus class="mr-1.5 size-3.5" />
        Nuevo
      </Button>
    </Teleport>

    <!-- Stats cards -->
    <div class="mb-6 grid grid-cols-2 gap-3">
      <StatCard label="Activos" :value="totalActive" :icon="Wrench" icon-bg-class="bg-primary/10 text-primary" :is-loading="isLoading" />
      <StatCard label="Pendientes" :value="totalPending" :icon="CheckCircle2" icon-bg-class="bg-secondary/10 text-secondary" :is-loading="isLoading" />
    </div>

    <!-- Error -->
    <ErrorAlert v-if="error" :message="error" class="mb-4" />

    <!-- Pending suggestions -->
    <div v-if="pendingSuggestions.length > 0" class="mb-6">
      <h2 class="mb-3 text-sm font-semibold">Sugerencias pendientes</h2>
      <div class="space-y-2">
        <Card v-for="sug in pendingSuggestions" :key="sug.id">
          <CardContent class="px-3 py-2.5">
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm font-semibold">{{ sug.name }}</p>
                  <span
                    class="inline-flex shrink-0 rounded-lg px-1.5 py-0.5 text-[11px] font-medium"
                    :class="CATEGORY_COLORS[sug.category]"
                  >
                    {{ CATEGORY_LABELS[sug.category] }}
                  </span>
                </div>
                <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
                  <span v-if="sug.phone">{{ sug.phone }}</span>
                  <span v-if="sug.phone && sug.createdByName" class="opacity-30">&middot;</span>
                  <span v-if="sug.createdByName">por {{ sug.createdByName }}</span>
                  <span v-if="sug.notes" class="opacity-30">&middot;</span>
                  <span v-if="sug.notes" class="truncate">{{ sug.notes }}</span>
                  <span class="ml-auto flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      class="h-6 px-2 text-[11px] text-primary"
                      title="Aprobar"
                      @click="handleApprove(sug.id)"
                    >
                      <CheckCircle2 class="mr-1 size-3" />
                      Aprobar
                    </Button>
                    <Button
                      variant="ghost"
                      class="h-6 px-2 text-[11px] text-destructive hover:text-destructive"
                      title="Rechazar"
                      @click="handleReject(sug.id)"
                    >
                      <Trash2 class="mr-1 size-3" />
                      Rechazar
                    </Button>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="5" variant="row" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="filteredProviders.length === 0"
      :icon="Wrench"
      title="No hay proveedores"
      :description="filterCategory || filterStatus ? 'Prueba cambiando los filtros' : 'Crea el primer proveedor del directorio'"
    >
      <template #action>
        <Button @click="openCreateDialog">
          <Plus class="mr-1.5 size-4" />
          Nuevo Proveedor
        </Button>
      </template>
    </EmptyState>

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
                  class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
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
                  class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
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
                      :class="item.status === 'active' ? 'text-primary' : 'text-muted-foreground'"
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
      <div class="space-y-2 md:hidden">
        <Card v-for="item in filteredProviders" :key="item.id">
          <CardContent class="px-3 py-2.5">
            <!-- Row 1: Name + stars + category badge -->
            <div class="flex items-center gap-2">
              <NuxtLink
                :to="`/mi-chana/proveedores/${item.id}`"
                class="truncate text-sm font-semibold text-primary underline-offset-2 hover:underline"
              >
                {{ item.name }}
              </NuxtLink>
              <div class="flex shrink-0 items-center gap-0.5">
                <Star
                  v-for="(filled, idx) in renderStars(item.averageRating)"
                  :key="idx"
                  class="size-2.5"
                  :class="filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'"
                />
              </div>
              <span
                class="ml-auto inline-flex shrink-0 rounded-lg px-1.5 py-0.5 text-[11px] font-medium"
                :class="CATEGORY_COLORS[item.category]"
              >
                {{ CATEGORY_LABELS[item.category] }}
              </span>
            </div>
            <!-- Row 2: Status · Phone | Actions inline -->
            <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
              <span
                class="inline-flex rounded-lg px-1.5 py-0.5 font-medium"
                :class="STATUS_CONFIG[item.status].class"
              >
                {{ STATUS_CONFIG[item.status].label }}
              </span>
              <span v-if="item.phone" class="opacity-30">&middot;</span>
              <span v-if="item.phone" class="tabular-nums">{{ item.phone }}</span>
              <span class="ml-auto flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  class="h-6 px-2 text-[11px]"
                  :title="item.status === 'active' ? 'Desactivar' : 'Activar'"
                  @click="handleToggleStatus(item)"
                >
                  <CheckCircle2
                    class="mr-1 size-3"
                    :class="item.status === 'active' ? 'text-primary' : 'text-muted-foreground'"
                  />
                  {{ item.status === 'active' ? 'Desactivar' : 'Activar' }}
                </Button>
                <Button
                  variant="ghost"
                  class="h-6 px-2 text-[11px]"
                  title="Editar"
                  @click="openEditDialog(item)"
                >
                  <Pencil class="mr-1 size-3" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  class="h-6 px-2 text-[11px] text-destructive hover:text-destructive"
                  title="Eliminar"
                  @click="confirmDelete(item.id)"
                >
                  <Trash2 class="size-3" />
                </Button>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Pagination -->
      <ListPagination v-model:current-page="currentPage" :total-pages="totalPages" class="mt-4" />
    </div>

    <!-- Create/Edit Sheet -->
    <Sheet v-model:open="dialogOpen">
      <SheetContent class="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{{ editingId ? 'Editar Proveedor' : 'Nuevo Proveedor' }}</SheetTitle>
          <SheetDescription>
            {{ editingId ? 'Modifica los datos del proveedor' : 'Completa los datos para agregar un proveedor' }}
          </SheetDescription>
        </SheetHeader>

        <form class="space-y-4 py-4" @submit.prevent="handleSubmit">
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
      </SheetContent>
    </Sheet>

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
