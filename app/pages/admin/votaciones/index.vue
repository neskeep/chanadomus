<script setup lang="ts">
import {
  Vote,
  Plus,
  Pencil,
  Trash2,
  Send,
  Lock,
  Calendar,
  FileText,
  GripVertical,
  Check,
} from 'lucide-vue-next'
import draggable from 'vuedraggable'
import { toast } from 'vue-sonner'
import type { Poll, PollStatus } from '~~/shared/types/poll'
import { POLL_STATUS_COLORS, POLL_STATUS_LABELS } from '~/composables/useColorMap'

useHead({ title: 'Gestion de Votaciones' })

const { formatDate } = useFormatDate()
const { isReordering, isSaving, saveOrder } = useReorder()

const {
  polls,
  isLoading,
  error,
  totalPages,
  fetchPolls,
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

// Local writable copy for drag-and-drop
const localPolls = ref<Poll[]>([])
watch(filteredPolls, val => { localPolls.value = [...val] }, { immediate: true })

function toggleReorder() {
  if (isReordering.value) {
    handleSaveOrder()
  }
  else {
    searchQuery.value = ''
    filterStatus.value = ''
    isReordering.value = true
  }
}

async function handleSaveOrder() {
  const items = localPolls.value.map((item, index) => ({
    id: item.id,
    displayOrder: index,
  }))
  await saveOrder('polls', items)
  toast.success('Orden guardado')
  isReordering.value = false
}

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
    <Teleport v-if="isMounted" :to="target" defer>
      <TopbarSearch v-model="searchQuery" placeholder="Buscar votacion...">
        <TopbarFilters :active="filterStatus !== ''" @clear="filterStatus = ''">
          <TopbarFilterGroup v-model="filterStatus" label="Estado" :options="statusOptions" />
        </TopbarFilters>
      </TopbarSearch>
      <Button size="icon" variant="ghost" class="size-8" :disabled="isSaving" :title="isReordering ? 'Guardar orden' : 'Reordenar'" @click="toggleReorder">
        <Check v-if="isReordering" class="size-4 text-primary" />
        <GripVertical v-else class="size-4" />
      </Button>
      <NuxtLink to="/admin/votaciones/crear">
        <Button size="sm">
          <Plus class="mr-1.5 size-3.5" />
          Nuevo
        </Button>
      </NuxtLink>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" :disabled="isSaving" :title="isReordering ? 'Guardar orden' : 'Reordenar'" @click="toggleReorder">
        <Check v-if="isReordering" class="size-4 text-primary" />
        <GripVertical v-else class="size-4" />
      </Button>
      <Button size="icon" variant="ghost" class="size-9" as-child>
        <NuxtLink to="/admin/votaciones/crear">
          <Plus class="size-4" />
        </NuxtLink>
      </Button>
    </TopbarMobileAction>

    <!-- Mobile search -->
    <div class="mb-4 md:hidden">
      <TopbarSearch v-model="searchQuery" placeholder="Buscar votacion...">
        <TopbarFilters :active="filterStatus !== ''" @clear="filterStatus = ''">
          <TopbarFilterGroup v-model="filterStatus" label="Estado" :options="statusOptions" />
        </TopbarFilters>
      </TopbarSearch>
    </div>

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
              <TableHead v-if="isReordering" class="w-8" />
              <TableHead>Título</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Participación</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Fecha creación</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <draggable
            v-if="isReordering"
            v-model="localPolls"
            tag="tbody"
            item-key="id"
            handle=".drag-handle"
            ghost-class="opacity-50"
            :animation="200"
          >
            <template #item="{ element: poll }: { element: Poll }">
              <TableRow>
                <TableCell class="w-8 px-2">
                  <GripVertical class="drag-handle size-4 cursor-grab text-muted-foreground active:cursor-grabbing" />
                </TableCell>
                <TableCell class="max-w-[220px]">
                  <p class="truncate font-medium">{{ poll.title }}</p>
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
                <TableCell />
              </TableRow>
            </template>
          </draggable>
          <TableBody v-else>
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
                    as-child
                  >
                    <NuxtLink :to="`/admin/votaciones/${poll.id}`">
                      <Pencil class="size-4" />
                    </NuxtLink>
                  </Button>
                  <Button
                    v-if="poll.status !== 'active'"
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

      <!-- Mobile cards (reorder mode) -->
      <draggable
        v-if="isReordering"
        v-model="localPolls"
        item-key="id"
        handle=".drag-handle"
        ghost-class="opacity-50"
        :animation="200"
        class="space-y-2 md:hidden"
      >
        <template #item="{ element: poll }: { element: Poll }">
          <Card class="min-w-0">
            <CardContent class="flex items-center gap-2 px-3 py-2.5">
              <GripVertical class="drag-handle size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold">{{ poll.title }}</p>
                <span
                  class="inline-flex rounded-lg px-2 py-0.5 text-[11px] font-medium"
                  :class="STATUS_CONFIG[poll.status].class"
                >
                  {{ STATUS_CONFIG[poll.status].label }}
                </span>
              </div>
            </CardContent>
          </Card>
        </template>
      </draggable>

      <!-- Mobile cards (normal mode) -->
      <div v-else class="space-y-2 md:hidden">
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
                  as-child
                >
                  <NuxtLink :to="`/admin/votaciones/${poll.id}`">
                    <Pencil class="size-3" />
                  </NuxtLink>
                </Button>
                <Button
                  v-if="poll.status !== 'active'"
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
