<script setup lang="ts">
import {
  Plus,
  X,
  Loader2,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { ChangelogItemType } from '~~/shared/types/changelog'
import { CHANGELOG_ITEM_TYPES } from '~~/shared/types/changelog'
import { CHANGELOG_TYPE_LABELS } from '~/composables/useColorMap'

useHead({ title: 'Nueva Entrada de Changelog' })

const router = useRouter()
const { isSaving, error, createEntry } = useChangelog()

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
    await createEntry({
      version: version.value.trim(),
      title: title.value.trim(),
      changes: validChanges,
      publishedAt: publishedAt.value || new Date().toISOString(),
    })
    toast.success('Entrada publicada')
    router.push('/admin/changelog')
  }
  catch {
    toast.error(error.value ?? 'Error al crear entrada')
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <Card>
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
              placeholder="YYYY-MM-DD (vacío = hoy)"
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
            {{ isSaving ? 'Publicando...' : 'Publicar entrada' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
