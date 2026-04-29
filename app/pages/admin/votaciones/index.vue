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
}

function openEditDialog(poll: Poll) {
  editingId.value = poll.id
  formTitle.value = poll.title
  formDescription.value = poll.description ?? ''
  formStatus.value = poll.status === 'closed' ? 'draft' : poll.status
  formDeadline.value = poll.deadline ? poll.deadline.split('T')[0] : ''
  dialogOpen.value = true
}

const canSubmit = computed(() =>
  formTitle.value.trim().length > 0 && !isSubmitting.value,
)

async function handleSubmit() {
  if (!editingId.value) return
  try {
    await updatePoll(editingId.value, {
      title: formTitle.value,
      description: formDescription.value || null,
      status: formStatus.value,
      deadline: formDeadline.value || null,
    })
    toast.success('Votación actualizada correctamente')
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
      <NuxtLink to="/admin/votaciones/crear">
        <Button size="sm">
          <Plus class="mr-1.5 size-3.5" />
          Nuevo
        </Button>
      </NuxtLink>
    </Teleport>

    <!-- Stats cards -->
    <div class="mb-6 grid grid-cols-2 gap-3">
      <StatCard label="Activas" :value="totalActive" :icon="Vote" icon-bg-class="bg-primary/10 text-primary" :is-loading="isLoading" />
      <StatCard label="Borradores" :value="totalDrafts" :icon="FileText" icon-bg-class="bg-muted text-muted-foreground" :is-loading="isLoading" />
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
                    <Send class="size-4 text-primary" />
                  </Button>
                  <Button
                    v-if="poll.status === 'active'"
                    variant="ghost"
                    size="icon"
                    class="size-10"
                    title="Cerrar votación"
                    @click="handleClose(poll.id)"
                  >
                    <Lock class="size-4 text-muted-foreground" />
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
      <div class="space-y-2 md:hidden">
        <Card v-for="poll in filteredPolls" :key="poll.id" class="min-w-0">
          <CardContent class="px-3 py-2.5">
            <!-- Row 1: Title + Status badge + Date -->
            <div class="flex items-center gap-1.5">
              <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ poll.title }}</p>
              <span
                class="shrink-0 inline-flex rounded-lg px-2 py-0.5 text-[11px] font-medium"
                :class="STATUS_CONFIG[poll.status].class"
              >
                {{ STATUS_CONFIG[poll.status].label }}
              </span>
              <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {{ formatDate(poll.createdAt) }}
              </span>
            </div>

            <!-- Row 2: Participation · Deadline | Actions inline -->
            <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
              <span>{{ participationText(poll) }}</span>
              <template v-if="poll.deadline">
                <span class="opacity-30">&middot;</span>
                <Calendar class="size-3 shrink-0" />
                <span class="shrink-0">{{ formatDate(poll.deadline) }}</span>
              </template>

              <!-- Inline actions -->
              <div class="ml-auto flex items-center gap-0.5">
                <Button
                  v-if="poll.status === 'draft'"
                  variant="ghost"
                  class="h-6 px-2 text-[11px] text-primary"
                  title="Publicar"
                  @click="handlePublish(poll.id)"
                >
                  <Send class="mr-1 size-3" />
                  Publicar
                </Button>
                <Button
                  v-if="poll.status === 'active'"
                  variant="ghost"
                  class="h-6 px-2 text-[11px] text-muted-foreground"
                  title="Cerrar votación"
                  @click="handleClose(poll.id)"
                >
                  <Lock class="mr-1 size-3" />
                  Cerrar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-6"
                  title="Editar"
                  @click="openEditDialog(poll)"
                >
                  <Pencil class="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-6 text-destructive hover:text-destructive"
                  title="Eliminar"
                  @click="confirmDelete(poll.id)"
                >
                  <Trash2 class="size-3" />
                </Button>
              </div>
            </div>

            <!-- Results for active/closed (compact) -->
            <div v-if="poll.status !== 'draft' && poll.options?.length" class="mt-1.5 space-y-1">
              <div v-for="opt in poll.options" :key="opt.id" class="space-y-0.5">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="truncate text-muted-foreground">{{ opt.text }}</span>
                  <span class="ml-2 shrink-0 font-medium tabular-nums">{{ opt.percentage ?? 0 }}%</span>
                </div>
                <Progress :model-value="opt.percentage ?? 0" class="h-1.5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Pagination -->
      <ListPagination v-model:current-page="currentPage" :total-pages="totalPages" class="mt-4" />
    </div>

    <!-- Edit Sheet -->
    <Sheet v-model:open="dialogOpen">
      <SheetContent side="right" class="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Editar Votación</SheetTitle>
          <SheetDescription>
            Modifica los datos de la votación
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
              <SelectTrigger id="poll-status" size="lg" class="mt-1.5">
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
              {{ isSubmitting ? 'Guardando...' : 'Guardar cambios' }}
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
