<script setup lang="ts">
import {
  Vote,
  Plus,
  Pencil,
  Trash2,
  Send,
  Lock,
  Loader2,
  Calendar,
  FileText,
  X,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Poll, PollStatus } from '~~/shared/types/poll'
import { POLL_STATUS_COLORS, POLL_STATUS_LABELS } from '~/composables/useColorMap'

useHead({ title: 'Gestion de Votaciones' })

const { formatDate } = useFormatDate()

const {
  polls,
  meta,
  isLoading,
  isSubmitting,
  error,
  totalPages,
  fetchPolls,
  createPoll,
  updatePoll,
  publishPoll,
  closePoll,
  deletePoll,
} = usePolls()

// Filters & pagination
const currentPage = ref(1)
const searchQuery = ref('')
const filterStatus = ref<PollStatus | ''>('')

const { target, isMounted } = useTopbarPortal()

const statusOptions = [
  { value: 'draft' as const, label: 'Borrador' },
  { value: 'active' as const, label: 'Activa' },
  { value: 'closed' as const, label: 'Cerrada' },
]

// Create/Edit dialog
const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const formTitle = ref('')
const formDescription = ref('')
const formStatus = ref<'draft' | 'active'>('draft')
const formDeadline = ref('')
const formOptions = ref<string[]>(['', ''])

// Delete dialog
const deleteId = ref<string | null>(null)
const deleteDialogOpen = ref(false)

const STATUS_CONFIG: Record<PollStatus, { label: string; class: string }> = {
  draft: { label: POLL_STATUS_LABELS.draft, class: POLL_STATUS_COLORS.draft },
  active: { label: POLL_STATUS_LABELS.active, class: POLL_STATUS_COLORS.active },
  closed: { label: POLL_STATUS_LABELS.closed, class: POLL_STATUS_COLORS.closed },
}

// Stats
const totalActive = computed(() => polls.value.filter(p => p.status === 'active').length)
const totalDrafts = computed(() => polls.value.filter(p => p.status === 'draft').length)

// Filtered by search (client-side, on top of server filters)
const filteredPolls = computed(() => {
  if (!searchQuery.value.trim()) return polls.value
  const q = searchQuery.value.trim().toLowerCase()
  return polls.value.filter(p =>
    p.title.toLowerCase().includes(q)
    || p.createdByName?.toLowerCase().includes(q),
  )
})

async function loadPolls() {
  const params: FetchParams = { page: currentPage.value }
  if (filterStatus.value) params.status = filterStatus.value
  await fetchPolls(params)
}

interface FetchParams {
  page?: number
  limit?: number
  status?: PollStatus
}

watch([currentPage, filterStatus], () => {
  loadPolls()
})

onMounted(() => {
  loadPolls()
})

function resetForm() {
  formTitle.value = ''
  formDescription.value = ''
  formStatus.value = 'draft'
  formDeadline.value = ''
  formOptions.value = ['', '']
}

function openCreateDialog() {
  editingId.value = null
  resetForm()
  dialogOpen.value = true
}

function openEditDialog(poll: Poll) {
  editingId.value = poll.id
  formTitle.value = poll.title
  formDescription.value = poll.description ?? ''
  formStatus.value = poll.status === 'closed' ? 'draft' : poll.status
  formDeadline.value = poll.deadline ? poll.deadline.split('T')[0] : ''
  formOptions.value = poll.options?.map(o => o.text) ?? ['', '']
  dialogOpen.value = true
}

function addOption() {
  formOptions.value.push('')
}

function removeOption(index: number) {
  if (formOptions.value.length <= 2) return
  formOptions.value.splice(index, 1)
}

const canSubmit = computed(() => {
  const hasTitle = formTitle.value.trim().length > 0
  const validOptions = formOptions.value.filter(o => o.trim().length > 0)
  return hasTitle && validOptions.length >= 2 && !isSubmitting.value
})

async function handleSubmit() {
  try {
    if (editingId.value) {
      await updatePoll(editingId.value, {
        title: formTitle.value,
        description: formDescription.value || null,
        status: formStatus.value,
        deadline: formDeadline.value || null,
      })
      toast.success('Votación actualizada correctamente')
    }
    else {
      const options = formOptions.value.filter(o => o.trim().length > 0)
      await createPoll({
        title: formTitle.value,
        description: formDescription.value || undefined,
        status: formStatus.value,
        deadline: formDeadline.value || undefined,
        options,
      })
      toast.success('Votación creada correctamente')
    }
    dialogOpen.value = false
    await loadPolls()
  }
  catch {
    toast.error(error.value ?? 'Error al guardar votación')
  }
}

async function handlePublish(id: string) {
  try {
    await publishPoll(id)
    toast.success('Votación publicada')
    await loadPolls()
  }
  catch {
    toast.error(error.value ?? 'Error al publicar votación')
  }
}

async function handleClose(id: string) {
  try {
    await closePoll(id)
    toast.success('Votación cerrada')
    await loadPolls()
  }
  catch {
    toast.error(error.value ?? 'Error al cerrar votación')
  }
}

function confirmDelete(id: string) {
  deleteId.value = id
  deleteDialogOpen.value = true
}

async function handleDelete() {
  if (!deleteId.value) return
  try {
    await deletePoll(deleteId.value)
    toast.success('Votación eliminada')
    deleteDialogOpen.value = false
    deleteId.value = null
    await loadPolls()
  }
  catch {
    toast.error(error.value ?? 'Error al eliminar votación')
  }
}

function participationText(poll: Poll): string {
  const votes = poll.totalVotes ?? 0
  const units = poll.totalUnits ?? 0
  return `${votes}/${units} votos`
}
</script>

<template>
  <div>
    <!-- Topbar actions -->
    <Teleport :to="target" defer v-if="isMounted">
      <TopbarSearch v-model="searchQuery" placeholder="Buscar votacion...">
        <TopbarFilters :active="filterStatus !== ''" @clear="filterStatus = ''">
          <TopbarFilterGroup v-model="filterStatus" label="Estado" :options="statusOptions" />
        </TopbarFilters>
      </TopbarSearch>
      <Button size="sm" @click="openCreateDialog">
        <Plus class="mr-1.5 size-3.5" />
        Nuevo
      </Button>
    </Teleport>

    <!-- Stats cards -->
    <div class="mb-6 grid grid-cols-2 gap-2">
      <div class="flex items-center gap-3 rounded-lg border bg-card p-4">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-emerald-100">
          <Vote class="size-5 text-emerald-600" />
        </div>
        <div>
          <p v-if="isLoading"><Skeleton class="h-5 w-8" /></p>
          <p v-else class="text-lg font-bold leading-none">{{ totalActive }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">Activas</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-lg border bg-card p-4">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-zinc-100">
          <FileText class="size-5 text-zinc-600" />
        </div>
        <div>
          <p v-if="isLoading"><Skeleton class="h-5 w-8" /></p>
          <p v-else class="text-lg font-bold leading-none">{{ totalDrafts }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">Borradores</p>
        </div>
      </div>
    </div>

    <!-- Error -->
    <ErrorAlert v-if="error" :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="5" variant="row" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="filteredPolls.length === 0"
      :icon="Vote"
      title="No hay votaciones"
      :description="filterStatus ? 'Prueba cambiando los filtros' : 'Las votaciones aparecerán aquí'"
    />

    <!-- Table (desktop) / Cards (mobile) -->
    <div v-else>
      <!-- Desktop table -->
      <div class="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Participación</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Fecha creación</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="poll in filteredPolls" :key="poll.id">
              <TableCell class="max-w-[220px]">
                <p class="truncate font-medium">{{ poll.title }}</p>
                <!-- Results inline for active/closed -->
                <div v-if="poll.status !== 'draft' && poll.options?.length" class="mt-1.5 space-y-1">
                  <div v-for="opt in poll.options" :key="opt.id" class="flex items-center gap-2 text-xs">
                    <span class="w-20 shrink-0 truncate text-muted-foreground">{{ opt.text }}</span>
                    <Progress :model-value="opt.percentage ?? 0" class="h-2 flex-1" />
                    <span class="w-8 shrink-0 text-right text-muted-foreground">{{ opt.percentage ?? 0 }}%</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span
                  class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                  :class="STATUS_CONFIG[poll.status].class"
                >
                  {{ STATUS_CONFIG[poll.status].label }}
                </span>
              </TableCell>
              <TableCell class="text-muted-foreground">
                {{ participationText(poll) }}
              </TableCell>
              <TableCell class="text-muted-foreground">
                {{ poll.deadline ? formatDate(poll.deadline) : '—' }}
              </TableCell>
              <TableCell class="text-muted-foreground">
                {{ formatDate(poll.createdAt) }}
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button
                    v-if="poll.status === 'draft'"
                    variant="ghost"
                    size="icon"
                    class="size-10"
                    title="Publicar"
                    @click="handlePublish(poll.id)"
                  >
                    <Send class="size-4 text-emerald-600" />
                  </Button>
                  <Button
                    v-if="poll.status === 'active'"
                    variant="ghost"
                    size="icon"
                    class="size-10"
                    title="Cerrar votación"
                    @click="handleClose(poll.id)"
                  >
                    <Lock class="size-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-10"
                    title="Editar"
                    @click="openEditDialog(poll)"
                  >
                    <Pencil class="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-10 text-destructive hover:text-destructive"
                    title="Eliminar"
                    @click="confirmDelete(poll.id)"
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
        <Card v-for="poll in filteredPolls" :key="poll.id">
          <CardContent class="p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium leading-snug">{{ poll.title }}</p>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ participationText(poll) }} · {{ formatDate(poll.createdAt) }}
                </p>
              </div>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                :class="STATUS_CONFIG[poll.status].class"
              >
                {{ STATUS_CONFIG[poll.status].label }}
              </span>
              <span v-if="poll.deadline" class="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar class="size-3" />
                {{ formatDate(poll.deadline) }}
              </span>
            </div>

            <!-- Results for active/closed -->
            <div v-if="poll.status !== 'draft' && poll.options?.length" class="mt-3 space-y-1.5">
              <div v-for="opt in poll.options" :key="opt.id" class="space-y-0.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="truncate text-muted-foreground">{{ opt.text }}</span>
                  <span class="ml-2 shrink-0 font-medium">{{ opt.percentage ?? 0 }}%</span>
                </div>
                <Progress :model-value="opt.percentage ?? 0" class="h-2" />
              </div>
            </div>

            <div class="mt-3 flex items-center gap-1">
              <Button
                v-if="poll.status === 'draft'"
                variant="ghost"
                size="icon"
                class="size-8"
                title="Publicar"
                @click="handlePublish(poll.id)"
              >
                <Send class="size-4 text-emerald-600" />
              </Button>
              <Button
                v-if="poll.status === 'active'"
                variant="ghost"
                size="icon"
                class="size-8"
                title="Cerrar votación"
                @click="handleClose(poll.id)"
              >
                <Lock class="size-4 text-blue-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="size-8"
                title="Editar"
                @click="openEditDialog(poll)"
              >
                <Pencil class="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="size-8 text-destructive hover:text-destructive"
                title="Eliminar"
                @click="confirmDelete(poll.id)"
              >
                <Trash2 class="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Pagination -->
      <ListPagination v-model:current-page="currentPage" :total-pages="totalPages" class="mt-4" />
    </div>

    <!-- Create/Edit Sheet -->
    <Sheet v-model:open="dialogOpen">
      <SheetContent side="right" class="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{{ editingId ? 'Editar Votación' : 'Nueva Votación' }}</SheetTitle>
          <SheetDescription>
            {{ editingId ? 'Modifica los datos de la votación' : 'Completa los datos para crear una nueva votación' }}
          </SheetDescription>
        </SheetHeader>

        <form class="space-y-4 py-2" @submit.prevent="handleSubmit">
          <div>
            <Label for="poll-title">Título</Label>
            <Input
              id="poll-title"
              v-model="formTitle"
              placeholder="Título de la votación"
              class="h-12 mt-1.5"
              required
            />
          </div>

          <div>
            <Label for="poll-description">Descripción (opcional)</Label>
            <Textarea
              id="poll-description"
              v-model="formDescription"
              placeholder="Descripción de la votación..."
              rows="3"
              class="mt-1.5"
            />
          </div>

          <!-- Dynamic options -->
          <div v-if="!editingId">
            <Label>Opciones de voto</Label>
            <div class="mt-1.5 space-y-2">
              <div v-for="(_, index) in formOptions" :key="index" class="flex gap-2">
                <Input
                  v-model="formOptions[index]"
                  :placeholder="`Opción ${index + 1}`"
                  class="h-12 flex-1"
                  required
                />
                <Button
                  v-if="formOptions.length > 2"
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                  @click="removeOption(index)"
                >
                  <X class="size-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                class="h-12 w-full"
                @click="addOption"
              >
                <Plus class="mr-1.5 size-4" />
                Agregar opción
              </Button>
            </div>
          </div>

          <div>
            <Label for="poll-deadline">Fecha límite (opcional)</Label>
            <div class="relative mt-1.5">
              <Calendar class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="poll-deadline"
                v-model="formDeadline"
                type="date"
                class="h-12 pl-9"
              />
            </div>
          </div>

          <div>
            <Label for="poll-status">Estado</Label>
            <Select v-model="formStatus">
              <SelectTrigger id="poll-status" class="h-12 mt-1.5">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="active">Activa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" @click="dialogOpen = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="!canSubmit">
              <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
              {{ isSubmitting ? 'Guardando...' : (editingId ? 'Guardar cambios' : 'Crear votación') }}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <!-- Delete AlertDialog -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar votación</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. La votación y todos sus votos serán eliminados permanentemente.
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
