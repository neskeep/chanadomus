<script setup lang="ts">
import {
  Plus,
  Megaphone,
  FileText,
  Send,
  Archive,
  Pencil,
  Trash2,
  Loader2,
  Paperclip,
  Calendar,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Announcement, AnnouncementCategory, AnnouncementStatus } from '~~/shared/types/announcement'

useHead({ title: 'Gestion de Anuncios' })

const { formatDate } = useFormatDate()

const {
  announcements,
  meta,
  isLoading,
  isSubmitting,
  error,
  totalPages,
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
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

// Create/Edit dialog
const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const formTitle = ref('')
const formBody = ref('')
const formCategory = ref<AnnouncementCategory>('general')
const formStatus = ref<AnnouncementStatus>('draft')
const formExpiresAt = ref('')
const formPdfFile = ref<File | null>(null)
const pdfInputRef = ref<HTMLInputElement | null>(null)

// Delete dialog
const deleteId = ref<string | null>(null)
const deleteDialogOpen = ref(false)

const CATEGORY_CONFIG: Record<AnnouncementCategory, { label: string, class: string }> = {
  general: { label: 'General', class: 'bg-blue-100 text-blue-800' },
  mantenimiento: { label: 'Mantenimiento', class: 'bg-amber-100 text-amber-800' },
  seguridad: { label: 'Seguridad', class: 'bg-red-100 text-red-800' },
  financiero: { label: 'Financiero', class: 'bg-emerald-100 text-emerald-800' },
  evento: { label: 'Evento', class: 'bg-purple-100 text-purple-800' },
  urgente: { label: 'Urgente', class: 'bg-red-200 text-red-900' },
}

const STATUS_CONFIG: Record<AnnouncementStatus, { label: string, class: string }> = {
  draft: { label: 'Borrador', class: 'bg-zinc-100 text-zinc-600' },
  published: { label: 'Publicado', class: 'bg-emerald-100 text-emerald-800' },
  archived: { label: 'Archivado', class: 'bg-zinc-100 text-zinc-500' },
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

function resetForm() {
  formTitle.value = ''
  formBody.value = ''
  formCategory.value = 'general'
  formStatus.value = 'draft'
  formExpiresAt.value = ''
  formPdfFile.value = null
}

function openCreateDialog() {
  editingId.value = null
  resetForm()
  dialogOpen.value = true
}

function openEditDialog(announcement: Announcement) {
  editingId.value = announcement.id
  formTitle.value = announcement.title
  formBody.value = announcement.body
  formCategory.value = announcement.category
  formStatus.value = announcement.status
  formExpiresAt.value = announcement.expiresAt ? announcement.expiresAt.split('T')[0] : ''
  formPdfFile.value = null
  dialogOpen.value = true
}

async function handleSubmit() {
  try {
    if (editingId.value) {
      const data: Partial<Pick<Announcement, 'title' | 'body' | 'category' | 'status' | 'expiresAt'>> = {
        title: formTitle.value,
        body: formBody.value,
        category: formCategory.value,
        status: formStatus.value,
      }
      if (formExpiresAt.value) data.expiresAt = formExpiresAt.value
      await updateAnnouncement(editingId.value, data)
      toast.success('Anuncio actualizado correctamente')
    }
    else {
      const formData = new FormData()
      formData.append('title', formTitle.value)
      formData.append('body', formBody.value)
      formData.append('category', formCategory.value)
      formData.append('status', formStatus.value)
      if (formExpiresAt.value) formData.append('expires_at', formExpiresAt.value)
      if (formPdfFile.value) formData.append('attachment', formPdfFile.value)
      await createAnnouncement(formData)
      toast.success('Anuncio creado correctamente')
    }
    dialogOpen.value = false
    await loadAnnouncements()
  }
  catch {
    toast.error(error.value ?? 'Error al guardar anuncio')
  }
}

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

function handlePdfSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) formPdfFile.value = file
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
      <Button size="sm" @click="openCreateDialog">
        <Plus class="mr-1.5 size-3.5" />
        Nuevo
      </Button>
    </Teleport>

    <!-- Stats cards -->
    <div class="mb-6 grid grid-cols-2 gap-2">
      <div class="flex items-center gap-3 rounded-lg border bg-card p-4">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-emerald-100">
          <Megaphone class="size-5 text-emerald-600" />
        </div>
        <div>
          <p v-if="isLoading"><Skeleton class="h-5 w-8" /></p>
          <p v-else class="text-lg font-bold leading-none">{{ totalPublished }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">Publicados</p>
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
                    @click="openEditDialog(item)"
                  >
                    <Pencil class="size-4" />
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
      <div class="space-y-3 md:hidden">
        <Card v-for="item in filteredAnnouncements" :key="item.id">
          <CardContent class="p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium leading-snug">{{ item.title }}</p>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ item.authorName ?? '—' }} · {{ formatDate(item.createdAt) }}
                </p>
              </div>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                :class="CATEGORY_CONFIG[item.category].class"
              >
                {{ CATEGORY_CONFIG[item.category].label }}
              </span>
              <span
                class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                :class="STATUS_CONFIG[item.status].class"
              >
                {{ STATUS_CONFIG[item.status].label }}
              </span>
            </div>
            <div class="mt-3 flex items-center gap-1">
              <Button
                v-if="item.status === 'draft'"
                variant="ghost"
                size="icon"
                class="size-8"
                title="Publicar"
                @click="handlePublish(item.id)"
              >
                <Send class="size-4 text-emerald-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="size-8"
                title="Editar"
                @click="openEditDialog(item)"
              >
                <Pencil class="size-4" />
              </Button>
              <Button
                v-if="item.status === 'published'"
                variant="ghost"
                size="icon"
                class="size-8"
                title="Archivar"
                @click="handleArchive(item.id)"
              >
                <Archive class="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="size-8 text-destructive hover:text-destructive"
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
      <ListPagination v-model:current-page="currentPage" :total-pages="totalPages" class="mt-4" />
    </div>

    <!-- Create/Edit Sheet -->
    <Sheet v-model:open="dialogOpen">
      <SheetContent side="right" class="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{{ editingId ? 'Editar Anuncio' : 'Nuevo Anuncio' }}</SheetTitle>
          <SheetDescription>
            {{ editingId ? 'Modifica los datos del anuncio' : 'Completa los datos para crear un nuevo anuncio' }}
          </SheetDescription>
        </SheetHeader>

        <form class="space-y-4 py-2" @submit.prevent="handleSubmit">
          <div>
            <label for="ann-title" class="text-sm font-medium">Título</label>
            <Input
              id="ann-title"
              v-model="formTitle"
              placeholder="Título del anuncio"
              class="h-12 mt-1.5"
              required
            />
          </div>

          <div>
            <label for="ann-body" class="text-sm font-medium">Cuerpo</label>
            <Textarea
              id="ann-body"
              v-model="formBody"
              placeholder="Contenido del anuncio..."
              rows="6"
              class="mt-1.5"
              required
            />
          </div>

          <div>
            <label for="ann-category" class="text-sm font-medium">Categoría</label>
            <Select v-model="formCategory">
              <SelectTrigger id="ann-category" class="h-12 mt-1.5">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="seguridad">Seguridad</SelectItem>
                <SelectItem value="financiero">Financiero</SelectItem>
                <SelectItem value="evento">Evento</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label for="ann-status" class="text-sm font-medium">Estado</label>
            <Select v-model="formStatus">
              <SelectTrigger id="ann-status" class="h-12 mt-1.5">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div v-if="!editingId">
            <label class="text-sm font-medium">Adjunto PDF</label>
            <div class="mt-1.5 flex items-center gap-2">
              <Button type="button" variant="outline" @click="pdfInputRef?.click()">
                <Paperclip class="mr-1.5 size-4" />
                {{ formPdfFile ? formPdfFile.name : 'Seleccionar PDF' }}
              </Button>
              <input
                ref="pdfInputRef"
                type="file"
                accept="application/pdf"
                class="hidden"
                @change="handlePdfSelect"
              />
              <span v-if="formPdfFile" class="text-xs text-muted-foreground">
                {{ (formPdfFile.size / 1024 / 1024).toFixed(1) }} MB
              </span>
            </div>
          </div>

          <div>
            <label for="ann-expires" class="text-sm font-medium">Fecha de expiración (opcional)</label>
            <div class="relative mt-1.5">
              <Calendar class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="ann-expires"
                v-model="formExpiresAt"
                type="date"
                class="h-12 pl-9"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" @click="dialogOpen = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="isSubmitting || !formTitle.trim() || !formBody.trim()">
              <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
              {{ isSubmitting ? 'Guardando...' : (editingId ? 'Guardar cambios' : 'Crear anuncio') }}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

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
