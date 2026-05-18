<script setup lang="ts">
import {
  Plus,
  FileText,
  Trash2,
  ExternalLink,
  BookOpen,
  Clock,
  Ruler,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { RegulationCategory } from '~~/shared/types/regulation'
import { REGULATION_CATEGORY_LABELS } from '~~/shared/types/regulation'

useHead({ title: 'Normativas' })

const { formatDate } = useFormatDate()
const { target, isMounted } = useTopbarPortal()

const {
  regulations,
  isLoading,
  error,
  fetchRegulations,
  deleteRegulation,
} = useRegulations()

const filterCategory = ref<RegulationCategory | ''>('')

const categoryOptions = [
  { value: 'normas' as const, label: 'Normas' },
  { value: 'horarios' as const, label: 'Horarios' },
  { value: 'arquitectura' as const, label: 'Arquitectura' },
]

const CATEGORY_ICONS: Record<RegulationCategory, typeof BookOpen> = {
  normas: BookOpen,
  horarios: Clock,
  arquitectura: Ruler,
}

const CATEGORY_BADGE_CLASS: Record<RegulationCategory, string> = {
  normas: 'bg-primary/10 text-primary',
  horarios: 'bg-amber-100 text-amber-700',
  arquitectura: 'bg-violet-100 text-violet-700',
}

// Delete dialog
const deleteId = ref<string | null>(null)
const deleteDialogOpen = ref(false)

const filteredRegulations = computed(() => {
  if (!filterCategory.value) return regulations.value
  return regulations.value.filter(r => r.category === filterCategory.value)
})

const totalByCategory = computed(() => ({
  normas: regulations.value.filter(r => r.category === 'normas').length,
  horarios: regulations.value.filter(r => r.category === 'horarios').length,
  arquitectura: regulations.value.filter(r => r.category === 'arquitectura').length,
}))

function confirmDelete(id: string) {
  deleteId.value = id
  deleteDialogOpen.value = true
}

async function handleDelete() {
  if (!deleteId.value) return
  try {
    await deleteRegulation(deleteId.value)
    toast.success('Normativa eliminada')
    deleteDialogOpen.value = false
    deleteId.value = null
    await fetchRegulations()
  }
  catch {
    toast.error(error.value ?? 'Error al eliminar normativa')
  }
}

watch(filterCategory, () => {
  // Client-side filter, no refetch needed
})

onMounted(() => {
  fetchRegulations()
})
</script>

<template>
  <div>
    <!-- Topbar actions -->
    <Teleport :to="target" defer v-if="isMounted">
      <TopbarFilters :active="filterCategory !== ''" @clear="filterCategory = ''">
        <TopbarFilterGroup v-model="filterCategory" label="Categoria" :options="categoryOptions" />
      </TopbarFilters>
      <NuxtLink to="/admin/normativas/subir">
        <Button size="sm">
          <Plus class="mr-1.5 size-3.5" />
          Subir
        </Button>
      </NuxtLink>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" as-child>
        <NuxtLink to="/admin/normativas/subir">
          <Plus class="size-4" />
        </NuxtLink>
      </Button>
    </TopbarMobileAction>

    <!-- Stats cards -->
    <div class="mb-6 grid grid-cols-3 gap-3">
      <StatCard
        label="Normas"
        :value="totalByCategory.normas"
        :icon="BookOpen"
        icon-bg-class="bg-primary/10 text-primary"
        :is-loading="isLoading"
      />
      <StatCard
        label="Horarios"
        :value="totalByCategory.horarios"
        :icon="Clock"
        icon-bg-class="bg-amber-100 text-amber-700"
        :is-loading="isLoading"
      />
      <StatCard
        label="Arquitectura"
        :value="totalByCategory.arquitectura"
        :icon="Ruler"
        icon-bg-class="bg-violet-100 text-violet-700"
        :is-loading="isLoading"
      />
    </div>

    <!-- Error -->
    <ErrorAlert v-if="error" :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="5" variant="row" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="filteredRegulations.length === 0"
      :icon="FileText"
      title="No hay normativas"
      :description="filterCategory ? 'Prueba cambiando los filtros' : 'Las normativas del condominio aparecerán aquí'"
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
              <TableHead>Autor</TableHead>
              <TableHead>Publicado</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in filteredRegulations" :key="item.id">
              <TableCell class="max-w-[250px] truncate font-medium">{{ item.title }}</TableCell>
              <TableCell>
                <span
                  class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                  :class="CATEGORY_BADGE_CLASS[item.category]"
                >
                  {{ REGULATION_CATEGORY_LABELS[item.category] }}
                </span>
              </TableCell>
              <TableCell class="text-muted-foreground">{{ item.authorName ?? '—' }}</TableCell>
              <TableCell class="text-muted-foreground tabular-nums">{{ formatDate(item.publishedAt) }}</TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-10"
                    title="Ver PDF"
                    as="a"
                    :href="`/api/regulations/attachments/${item.attachmentPath}`"
                    target="_blank"
                  >
                    <ExternalLink class="size-4" />
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
        <Card v-for="item in filteredRegulations" :key="item.id">
          <CardContent class="px-3 py-2.5">
            <!-- Row 1: Title + Category badge -->
            <div class="flex items-center gap-1.5">
              <component :is="CATEGORY_ICONS[item.category]" class="size-4 shrink-0 text-muted-foreground" />
              <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ item.title }}</p>
              <span
                class="inline-flex shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                :class="CATEGORY_BADGE_CLASS[item.category]"
              >
                {{ REGULATION_CATEGORY_LABELS[item.category] }}
              </span>
            </div>
            <!-- Row 2: Author · Date | Actions inline -->
            <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
              <span class="truncate">{{ item.authorName ?? '—' }}</span>
              <span class="opacity-30">&middot;</span>
              <span class="shrink-0 tabular-nums">{{ formatDate(item.publishedAt) }}</span>
              <span class="ml-auto flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  class="h-6 px-2 text-[11px] text-primary hover:text-primary"
                  title="Ver PDF"
                  as="a"
                  :href="`/api/regulations/attachments/${item.attachmentPath}`"
                  target="_blank"
                >
                  <ExternalLink class="size-3" />
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
    </div>

    <!-- Delete AlertDialog -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar normativa</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. La normativa y su archivo PDF serán eliminados permanentemente.
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
