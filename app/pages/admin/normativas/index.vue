<script setup lang="ts">
import {
  Plus,
  FileText,
  Pencil,
  Trash2,
  ExternalLink,
  GripVertical,
  Check,
} from 'lucide-vue-next'
import draggable from 'vuedraggable'
import { toast } from 'vue-sonner'
import type { Regulation } from '~~/shared/types/regulation'

useHead({ title: 'Normativas' })

const { formatDate } = useFormatDate()
const { target, isMounted } = useTopbarPortal()
const { isReordering, isSaving, saveOrder } = useReorder()

const {
  regulations,
  isLoading,
  error,
  fetchRegulations,
  deleteRegulation,
} = useRegulations()

// Local writable copy for drag-and-drop
const localRegulations = ref<Regulation[]>([])
watch(regulations, val => { localRegulations.value = [...val] }, { immediate: true })

function toggleReorder() {
  if (isReordering.value) {
    handleSaveOrder()
  }
  else {
    isReordering.value = true
  }
}

async function handleSaveOrder() {
  const items = localRegulations.value.map((item, index) => ({
    id: item.id,
    displayOrder: index,
  }))
  await saveOrder('regulations', items)
  toast.success('Orden guardado')
  isReordering.value = false
}

// Delete dialog
const deleteId = ref<string | null>(null)
const deleteDialogOpen = ref(false)

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

onMounted(() => {
  fetchRegulations()
})
</script>

<template>
  <div>
    <!-- Topbar actions -->
    <Teleport v-if="isMounted" :to="target" defer>
      <Button size="icon" variant="ghost" class="size-8" :disabled="isSaving" :title="isReordering ? 'Guardar orden' : 'Reordenar'" @click="toggleReorder">
        <Check v-if="isReordering" class="size-4 text-primary" />
        <GripVertical v-else class="size-4" />
      </Button>
      <NuxtLink to="/admin/normativas/subir">
        <Button size="sm">
          <Plus class="mr-1.5 size-3.5" />
          Subir
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
        <NuxtLink to="/admin/normativas/subir">
          <Plus class="size-4" />
        </NuxtLink>
      </Button>
    </TopbarMobileAction>

    <!-- Error -->
    <ErrorAlert v-if="error" :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="5" variant="row" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="regulations.length === 0"
      :icon="FileText"
      title="No hay normativas"
      description="Las normativas del condominio aparecerán aquí"
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
              <TableHead>Autor</TableHead>
              <TableHead>Publicado</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <draggable
            v-if="isReordering"
            v-model="localRegulations"
            tag="tbody"
            item-key="id"
            handle=".drag-handle"
            ghost-class="opacity-50"
            :animation="200"
          >
            <template #item="{ element: item }: { element: Regulation }">
              <TableRow>
                <TableCell class="w-8 px-2">
                  <GripVertical class="drag-handle size-4 cursor-grab text-muted-foreground active:cursor-grabbing" />
                </TableCell>
                <TableCell class="max-w-[250px] truncate font-medium">{{ item.title }}</TableCell>
                <TableCell class="text-muted-foreground">{{ item.authorName ?? '—' }}</TableCell>
                <TableCell class="text-muted-foreground tabular-nums">{{ formatDate(item.publishedAt) }}</TableCell>
                <TableCell />
              </TableRow>
            </template>
          </draggable>
          <TableBody v-else>
            <TableRow v-for="item in regulations" :key="item.id">
              <TableCell class="max-w-[250px] truncate font-medium">{{ item.title }}</TableCell>
              <TableCell class="text-muted-foreground">{{ item.authorName ?? '—' }}</TableCell>
              <TableCell class="text-muted-foreground tabular-nums">{{ formatDate(item.publishedAt) }}</TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-10"
                    title="Editar"
                    as-child
                  >
                    <NuxtLink :to="`/admin/normativas/${item.id}`">
                      <Pencil class="size-4" />
                    </NuxtLink>
                  </Button>
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

      <!-- Mobile cards (reorder mode) -->
      <draggable
        v-if="isReordering"
        v-model="localRegulations"
        item-key="id"
        handle=".drag-handle"
        ghost-class="opacity-50"
        :animation="200"
        class="space-y-2 md:hidden"
      >
        <template #item="{ element: item }: { element: Regulation }">
          <Card>
            <CardContent class="flex items-center gap-2 px-3 py-2.5">
              <GripVertical class="drag-handle size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
              <FileText class="size-4 shrink-0 text-muted-foreground" />
              <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ item.title }}</p>
            </CardContent>
          </Card>
        </template>
      </draggable>

      <!-- Mobile cards (normal mode) -->
      <div v-else class="space-y-2 md:hidden">
        <Card v-for="item in regulations" :key="item.id">
          <CardContent class="px-3 py-2.5">
            <!-- Row 1: Icon + Title -->
            <div class="flex items-center gap-2">
              <FileText class="size-4 shrink-0 text-muted-foreground" />
              <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ item.title }}</p>
            </div>
            <!-- Row 2: Author · Date | Actions inline -->
            <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
              <span class="truncate">{{ item.authorName ?? '—' }}</span>
              <span class="opacity-30">&middot;</span>
              <span class="shrink-0 tabular-nums">{{ formatDate(item.publishedAt) }}</span>
              <span class="ml-auto flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  class="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  title="Editar"
                  as-child
                >
                  <NuxtLink :to="`/admin/normativas/${item.id}`">
                    <Pencil class="size-3" />
                  </NuxtLink>
                </Button>
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
