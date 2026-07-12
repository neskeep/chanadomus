<script setup lang="ts">
import {
  Plus,
  X,
  Loader2,
  Trash2,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { ChangelogItemType } from '~~/shared/types/changelog'
import { CHANGELOG_ITEM_TYPES } from '~~/shared/types/changelog'
import { CHANGELOG_TYPE_LABELS } from '~/composables/useColorMap'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const { entry, isLoading, isSaving, isDeleting, error, fetchEntry, updateEntry, deleteEntry } = useChangelog()

// Override page info with dynamic title
const pageOverride = computed(() => {
  if (!entry.value) return null
  return { title: `Editar v${entry.value.version}` }
})
usePageInfoOverride(pageOverride)

useHead({ title: () => entry.value ? `Editar v${entry.value.version}` : 'Editar' })

// Form state
const version = ref('')
const title = ref('')
const publishedAt = ref('')
const changes = ref<Array<{ type: ChangelogItemType; description: string }>>([
  { type: 'added', description: '' },
])

function addChange() {
  changes.value.push({ type: 'added', description: '' })
}

function removeChange(index: number) {
  changes.value.splice(index, 1)
}

// Populate form when entry loads
watch(entry, (val) => {
  if (!val) return
  version.value = val.version
  title.value = val.title
  publishedAt.value = val.publishedAt ? val.publishedAt.split('T')[0] ?? '' : ''
  changes.value = val.changes.length > 0
    ? val.changes.map(c => ({ type: c.type as ChangelogItemType, description: c.description }))
    : [{ type: 'added', description: '' }]
}, { immediate: true })

const canSubmit = computed(() => {
  if (!version.value.trim()) return false
  if (!title.value.trim()) return false
  if (changes.value.length === 0) return false
  return changes.value.some(c => c.description.trim() !== '')
})

async function handleSubmit() {
  if (!canSubmit.value) return

  const validChanges = changes.value.filter(c => c.description.trim() !== '')

  try {
    await updateEntry(id, {
      version: version.value.trim(),
      title: title.value.trim(),
      changes: validChanges,
      publishedAt: publishedAt.value || undefined,
    })
    toast.success('Entrada actualizada')
    router.push('/admin/changelog')
  }
  catch {
    toast.error(error.value ?? 'Error al actualizar entrada')
  }
}

async function handleDelete() {
  try {
    await deleteEntry(id)
    toast.success('Entrada eliminada correctamente')
    router.push('/admin/changelog')
  }
  catch {
    toast.error(error.value ?? 'Error al eliminar entrada')
  }
}

onMounted(() => {
  fetchEntry(id)
})
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <Skeleton class="h-8 w-3/4" />
      <Skeleton class="h-4 w-1/2" />
      <Skeleton class="h-32 w-full" />
    </div>

    <!-- Error -->
    <ErrorAlert v-else-if="error && !entry" :message="error" />

    <!-- Content -->
    <template v-else-if="entry">
      <Card class="mb-4">
        <CardContent class="p-5 md:p-8">
          <form class="space-y-6" @submit.prevent="handleSubmit">
            <!-- Version -->
            <div class="space-y-1.5">
              <Label for="version">Versión <span class="text-destructive">*</span></Label>
              <Input
                id="version"
                v-model="version"
                placeholder="1.2.0"
                required
                class="text-base"
              />
            </div>

            <!-- Title -->
            <div class="space-y-1.5">
              <Label for="title">Título <span class="text-destructive">*</span></Label>
              <Input
                id="title"
                v-model="title"
                placeholder="Resumen de la versión"
                required
                maxlength="200"
                class="text-base"
              />
            </div>

            <!-- Published At -->
            <div class="space-y-1.5">
              <Label for="published-at">Fecha de publicación</Label>
              <Input
                id="published-at"
                v-model="publishedAt"
                placeholder="YYYY-MM-DD"
                class="text-base"
              />
            </div>

            <!-- Changes -->
            <div class="space-y-3">
              <Label>Cambios <span class="text-destructive">*</span></Label>

              <div
                v-for="(change, index) in changes"
                :key="index"
                class="flex items-start gap-2"
              >
                <Select v-model="change.type" class="w-[140px] shrink-0">
                  <SelectTrigger class="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="itemType in CHANGELOG_ITEM_TYPES" :key="itemType" :value="itemType">
                      {{ CHANGELOG_TYPE_LABELS[itemType] }}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  v-model="change.description"
                  placeholder="Descripción del cambio"
                  class="flex-1 text-base"
                />

                <Button
                  v-if="changes.length > 1"
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                  @click="removeChange(index)"
                >
                  <X class="size-4" />
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                class="gap-1.5"
                @click="addChange"
              >
                <Plus class="size-4" />
                Agregar cambio
              </Button>
            </div>

            <!-- Submit -->
            <Button
              type="submit"
              class="h-12 w-full text-base font-semibold"
              :disabled="!canSubmit || isSaving"
            >
              <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" />
              {{ isSaving ? 'Guardando...' : 'Guardar cambios' }}
            </Button>
          </form>
        </CardContent>
      </Card>

      <!-- Delete -->
      <Card class="border-destructive/30">
        <CardContent class="flex items-center justify-between gap-4 p-5 md:px-8">
          <div>
            <p class="text-sm font-semibold text-destructive">Eliminar entrada</p>
            <p class="text-xs text-muted-foreground">Esta acción no se puede deshacer.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="destructive" size="sm">
                <Trash2 class="mr-1.5 size-3.5" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>¿Eliminar esta entrada?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará permanentemente la entrada v{{ entry.version }} — "{{ entry.title }}".
              </AlertDialogDescription>
              <div class="flex justify-end gap-2">
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  class="bg-destructive text-white hover:bg-destructive/90"
                  :disabled="isDeleting"
                  @click="handleDelete"
                >
                  <Loader2 v-if="isDeleting" class="mr-1.5 size-3.5 animate-spin" />
                  Eliminar
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
