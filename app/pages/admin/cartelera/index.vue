<script setup lang="ts">
import {
  Plus,
  Megaphone,
  FileText,
  Send,
  Archive,
  Pencil,
  Trash2,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { AnnouncementCategory, AnnouncementStatus } from '~~/shared/types/announcement'
import { ANNOUNCEMENT_CATEGORY_COLORS, ANNOUNCEMENT_CATEGORY_LABELS, ANNOUNCEMENT_STATUS_COLORS, ANNOUNCEMENT_STATUS_LABELS } from '~/composables/useColorMap'

useHead({ title: 'Gestion de Anuncios' })

const { formatDate } = useFormatDate()

const {
  announcements,
  meta,
  isLoading,
  error,
  totalPages,
  fetchAnnouncements,
  publishAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
} = useAnnouncements()

// Filters & pagination
const currentPage = ref(1)
const searchQuery = ref('')
const filterCategory = ref<AnnouncementCategory | ''>('')

const { target, isMounted } = useTopbarPortal()

const categoryOptions = [
  { value: 'general' as const, label: 'General' },
  { value: 'mantenimiento' as const, label: 'Mantenimiento' },
  { value: 'seguridad' as const, label: 'Seguridad' },
  { value: 'financiero' as const, label: 'Financiero' },
  { value: 'evento' as const, label: 'Evento' },
  { value: 'urgente' as const, label: 'Urgente' },
]

// Delete dialog
const deleteId = ref<string | null>(null)
const deleteDialogOpen = ref(false)

const CATEGORY_CONFIG: Record<AnnouncementCategory, { label: string, class: string }> = {
  general: { label: ANNOUNCEMENT_CATEGORY_LABELS.general, class: ANNOUNCEMENT_CATEGORY_COLORS.general },
  mantenimiento: { label: ANNOUNCEMENT_CATEGORY_LABELS.mantenimiento, class: ANNOUNCEMENT_CATEGORY_COLORS.mantenimiento },
  seguridad: { label: ANNOUNCEMENT_CATEGORY_LABELS.seguridad, class: ANNOUNCEMENT_CATEGORY_COLORS.seguridad },
  financiero: { label: ANNOUNCEMENT_CATEGORY_LABELS.financiero, class: ANNOUNCEMENT_CATEGORY_COLORS.financiero },
  evento: { label: ANNOUNCEMENT_CATEGORY_LABELS.evento, class: ANNOUNCEMENT_CATEGORY_COLORS.evento },
  urgente: { label: ANNOUNCEMENT_CATEGORY_LABELS.urgente, class: ANNOUNCEMENT_CATEGORY_COLORS.urgente },
}

const STATUS_CONFIG: Record<AnnouncementStatus, { label: string, class: string }> = {
  draft: { label: ANNOUNCEMENT_STATUS_LABELS.draft, class: ANNOUNCEMENT_STATUS_COLORS.draft },
  published: { label: ANNOUNCEMENT_STATUS_LABELS.published, class: ANNOUNCEMENT_STATUS_COLORS.published },
  archived: { label: ANNOUNCEMENT_STATUS_LABELS.archived, class: ANNOUNCEMENT_STATUS_COLORS.archived },
}

// Stats
const totalPublished = computed(() => announcements.value.filter(a => a.status === 'published').length)
const totalDrafts = computed(() => announcements.value.filter(a => a.status === 'draft').length)

// Filtered by search (client-side, on top of server filters)
const filteredAnnouncements = computed(() => {
  if (!searchQuery.value.trim()) return announcements.value
  const q = searchQuery.value.trim().toLowerCase()
  return announcements.value.filter(a =>
    a.title.toLowerCase().includes(q)
    || a.authorName?.toLowerCase().includes(q),
  )
})

async function loadAnnouncements() {
  const params: Record<string, unknown> = { page: currentPage.value }
  if (filterCategory.value) params.category = filterCategory.value
  await fetchAnnouncements(params as Parameters<typeof fetchAnnouncements>[0])
}

watch([currentPage, filterCategory], () => {
  loadAnnouncements()
})

onMounted(() => {
  loadAnnouncements()
})

async function handlePublish(id: string) {
  try {
    await publishAnnouncement(id)
    toast.success('Anuncio publicado')
    await loadAnnouncements()
  }
  catch {
    toast.error(error.value ?? 'Error al publicar anuncio')
  }
}

async function handleArchive(id: string) {
  try {
    await archiveAnnouncement(id)
    toast.success('Anuncio archivado')
    await loadAnnouncements()
  }
  catch {
    toast.error(error.value ?? 'Error al archivar anuncio')
  }
}

function confirmDelete(id: string) {
  deleteId.value = id
  deleteDialogOpen.value = true
}

async function handleDelete() {
  if (!deleteId.value) return
  try {
    await deleteAnnouncement(deleteId.value)
    toast.success('Anuncio eliminado')
    deleteDialogOpen.value = false
    deleteId.value = null
    await loadAnnouncements()
  }
  catch {
    toast.error(error.value ?? 'Error al eliminar anuncio')
  }
}

</script>

<template>
  <div>
    <!-- Topbar actions -->
    <Teleport :to="target" defer v-if="isMounted">
      <TopbarSearch v-model="searchQuery" placeholder="Buscar anuncio...">
        <TopbarFilters :active="filterCategory !== ''" @clear="filterCategory = ''">
          <TopbarFilterGroup v-model="filterCategory" label="Categoria" :options="categoryOptions" />
        </TopbarFilters>
      </TopbarSearch>
      <NuxtLink to="/admin/cartelera/crear">
        <Button size="sm">
          <Plus class="mr-1.5 size-3.5" />
          Nuevo
        </Button>
      </NuxtLink>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" as-child>
        <NuxtLink to="/admin/cartelera/crear">
          <Plus class="size-4" />
        </NuxtLink>
      </Button>
    </TopbarMobileAction>

    <!-- Stats cards -->
    <div class="mb-6 grid grid-cols-2 gap-3">
      <StatCard
        label="Publicados"
        :value="totalPublished"
        :icon="Megaphone"
        icon-bg-class="bg-primary/10 text-primary"
        :is-loading="isLoading"
      />
      <StatCard
        label="Borradores"
        :value="totalDrafts"
        :icon="FileText"
        icon-bg-class="bg-muted text-muted-foreground"
        :is-loading="isLoading"
      />
    </div>

    <!-- Error -->
    <ErrorAlert v-if="error" :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="5" variant="row" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="filteredAnnouncements.length === 0"
      :icon="Megaphone"
      title="No hay anuncios"
      :description="filterCategory ? 'Prueba cambiando los filtros' : 'Los anuncios de la cartelera aparecerán aquí'"
    />

    <!-- Table (desktop) / Cards (mobile) -->
    <div v-else>
      <!-- Desktop table -->
      <div class="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in filteredAnnouncements" :key="item.id">
              <TableCell class="max-w-[200px] truncate font-medium">{{ item.title }}</TableCell>
              <TableCell>
                <span
                  class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                  :class="CATEGORY_CONFIG[item.category].class"
                >
                  {{ CATEGORY_CONFIG[item.category].label }}
                </span>
              </TableCell>
              <TableCell>
                <span
                  class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                  :class="STATUS_CONFIG[item.status].class"
                >
                  {{ STATUS_CONFIG[item.status].label }}
                </span>
              </TableCell>
              <TableCell class="text-muted-foreground">{{ item.authorName ?? '—' }}</TableCell>
              <TableCell class="text-muted-foreground">{{ formatDate(item.createdAt) }}</TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button
                    v-if="item.status === 'draft'"
                    variant="ghost"
                    size="icon"
                    class="size-10"
                    title="Publicar"
                    @click="handlePublish(item.id)"
                  >
                    <Send class="size-4 text-emerald-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-10"
                    title="Editar"
                    as-child
                  >
                    <NuxtLink :to="`/admin/cartelera/${item.id}`">
                      <Pencil class="size-4" />
                    </NuxtLink>
                  </Button>
                  <Button
                    v-if="item.status === 'published'"
                    variant="ghost"
                    size="icon"
                    class="size-10"
                    title="Archivar"
                    @click="handleArchive(item.id)"
                  >
                    <Archive class="size-4" />
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
        <Card v-for="item in filteredAnnouncements" :key="item.id">
          <CardContent class="px-3 py-2.5">
            <!-- Row 1: Title + Category badge + Date -->
            <div class="flex items-center gap-1.5">
              <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ item.title }}</p>
              <span
                class="inline-flex shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                :class="CATEGORY_CONFIG[item.category].class"
              >
                {{ CATEGORY_CONFIG[item.category].label }}
              </span>
            </div>
            <!-- Row 2: Status · Author · Date | Actions inline -->
            <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
              <span
                class="inline-flex shrink-0 rounded-lg px-1.5 py-0.5 font-medium"
                :class="STATUS_CONFIG[item.status].class"
              >
                {{ STATUS_CONFIG[item.status].label }}
              </span>
              <span class="opacity-30">·</span>
              <span class="truncate">{{ item.authorName ?? '—' }}</span>
              <span class="opacity-30">·</span>
              <span class="shrink-0 tabular-nums">{{ formatDate(item.createdAt) }}</span>
              <span class="ml-auto flex shrink-0 items-center gap-0.5">
                <Button
                  v-if="item.status === 'draft'"
                  variant="ghost"
                  class="h-6 px-2 text-[11px] text-primary hover:text-primary"
                  title="Publicar"
                  @click="handlePublish(item.id)"
                >
                  <Send class="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  class="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  title="Editar"
                  as-child
                >
                  <NuxtLink :to="`/admin/cartelera/${item.id}`">
                    <Pencil class="size-3" />
                  </NuxtLink>
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

    <!-- Delete AlertDialog -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar anuncio</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. El anuncio será eliminado permanentemente.
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
