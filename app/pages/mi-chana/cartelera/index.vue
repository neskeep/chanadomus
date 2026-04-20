<script setup lang="ts">
import {
  Megaphone,
  ChevronDown,
  ChevronUp,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-vue-next'
import type { AnnouncementCategory } from '~~/shared/types/announcement'

definePageMeta({ layout: 'default', title: 'Cartelera' })

const { announcements, meta, isLoading, error, totalPages, fetchAnnouncements } = useAnnouncements()

const currentPage = ref(1)
const activeCategory = ref<AnnouncementCategory | 'all'>('all')
const expandedId = ref<string | null>(null)

const CATEGORY_CONFIG: Record<AnnouncementCategory, { label: string; class: string }> = {
  general: { label: 'General', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  mantenimiento: { label: 'Mantenimiento', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  seguridad: { label: 'Seguridad', class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  financiero: { label: 'Financiero', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  evento: { label: 'Evento', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  urgente: { label: 'Urgente', class: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' },
}

const categoryTabs: { value: AnnouncementCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'general', label: 'General' },
  { value: 'mantenimiento', label: 'Mantenim.' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'financiero', label: 'Financiero' },
  { value: 'evento', label: 'Evento' },
  { value: 'urgente', label: 'Urgente' },
]

function loadAnnouncements() {
  const params: Record<string, string | number> = {
    page: currentPage.value,
    status: 'published',
  }
  if (activeCategory.value !== 'all') {
    params.category = activeCategory.value
  }
  fetchAnnouncements(params)
}

watch(activeCategory, () => {
  currentPage.value = 1
})

watch([currentPage, activeCategory], () => {
  loadAnnouncements()
})

onMounted(() => {
  loadAnnouncements()
})

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function isNew(publishedAt: string | null): boolean {
  if (!publishedAt) return false
  const published = new Date(publishedAt).getTime()
  const now = Date.now()
  return now - published < 24 * 60 * 60 * 1000
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="mx-auto max-w-lg">
    <!-- Category filter tabs -->
    <div class="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Button
        v-for="tab in categoryTabs"
        :key="tab.value"
        :variant="activeCategory === tab.value ? 'default' : 'outline'"
        size="sm"
        class="shrink-0"
        @click="activeCategory = tab.value"
      >
        {{ tab.label }}
      </Button>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      role="alert"
      class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-3">
      <Card v-for="i in 3" :key="i">
        <CardContent class="p-4">
          <div class="space-y-3">
            <div class="flex gap-2">
              <Skeleton class="h-5 w-16 rounded-full" />
              <Skeleton class="h-5 w-20 rounded-full" />
            </div>
            <Skeleton class="h-4 w-3/4" />
            <Skeleton class="h-3 w-28" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Content -->
    <template v-else-if="!error">
      <!-- Empty state -->
      <div
        v-if="announcements.length === 0"
        class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"
      >
        <div class="flex size-12 items-center justify-center rounded-full bg-muted">
          <Megaphone class="size-6 text-muted-foreground" />
        </div>
        <div>
          <p class="font-medium">No hay anuncios</p>
          <p class="mt-1 text-sm text-muted-foreground">
            Los comunicados de la administracion apareceran aqui
          </p>
        </div>
      </div>

      <!-- Announcement cards -->
      <div v-else class="space-y-3">
        <Card
          v-for="item in announcements"
          :key="item.id"
          class="cursor-pointer transition-shadow hover:shadow-md"
          @click="toggleExpand(item.id)"
        >
          <CardContent class="p-4">
            <!-- Top row: badges + chevron -->
            <div class="flex items-start justify-between gap-2">
              <div class="flex flex-wrap items-center gap-1.5">
                <!-- NEW badge -->
                <span
                  v-if="isNew(item.publishedAt)"
                  class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                >
                  <Sparkles class="size-3" />
                  Nuevo
                </span>
                <!-- Category badge -->
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="CATEGORY_CONFIG[item.category].class"
                >
                  {{ CATEGORY_CONFIG[item.category].label }}
                </span>
              </div>
              <component
                :is="expandedId === item.id ? ChevronUp : ChevronDown"
                class="mt-0.5 size-4 shrink-0 text-muted-foreground"
              />
            </div>

            <!-- Title -->
            <p class="mt-2 text-sm font-medium leading-snug">{{ item.title }}</p>

            <!-- Date + Author -->
            <p class="mt-1 text-xs text-muted-foreground">
              {{ formatDate(item.publishedAt ?? item.createdAt) }}
              <span v-if="item.authorName"> &middot; {{ item.authorName }}</span>
            </p>

            <!-- Expanded content -->
            <div v-if="expandedId === item.id" class="mt-3 border-t pt-3" @click.stop>
              <p class="whitespace-pre-line text-sm text-muted-foreground">{{ item.body }}</p>

              <!-- PDF download -->
              <div v-if="item.attachmentPath" class="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  as="a"
                  :href="`/api/announcements/attachments/${item.attachmentPath}`"
                  target="_blank"
                >
                  <FileDown class="mr-1.5 size-4" />
                  Descargar PDF
                </Button>
              </div>

              <!-- Expiry notice -->
              <p v-if="item.expiresAt" class="mt-2 text-[10px] text-muted-foreground">
                Vigente hasta: {{ formatDate(item.expiresAt) }}
              </p>
            </div>
          </CardContent>
        </Card>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            <ChevronLeft class="mr-1 size-4" />
            Anterior
          </Button>
          <span class="text-sm text-muted-foreground">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            Siguiente
            <ChevronRight class="ml-1 size-4" />
          </Button>
        </div>
      </div>
    </template>
  </div>
</template>
