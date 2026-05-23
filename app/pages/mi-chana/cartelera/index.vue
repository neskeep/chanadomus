<script setup lang="ts">
import {
  Megaphone,
  ChevronDown,
  ChevronUp,
  FileDown,
  Sparkles,
} from 'lucide-vue-next'
import type { AnnouncementCategory } from '~~/shared/types/announcement'
import { ANNOUNCEMENT_CATEGORY_COLORS, ANNOUNCEMENT_CATEGORY_LABELS } from '~/composables/useColorMap'

useHead({ title: 'Cartelera' })

const { target, isMounted } = useTopbarPortal()
const { formatDate } = useFormatDate()
const { announcements, meta, isLoading, error, totalPages, fetchAnnouncements } = useAnnouncements()

const currentPage = ref(1)
const activeCategory = ref<AnnouncementCategory | ''>('')
const expandedId = ref<string | null>(null)

const CATEGORY_CONFIG: Record<AnnouncementCategory, { label: string; class: string }> = {
  general: { label: ANNOUNCEMENT_CATEGORY_LABELS.general, class: ANNOUNCEMENT_CATEGORY_COLORS.general },
  mantenimiento: { label: ANNOUNCEMENT_CATEGORY_LABELS.mantenimiento, class: ANNOUNCEMENT_CATEGORY_COLORS.mantenimiento },
  seguridad: { label: ANNOUNCEMENT_CATEGORY_LABELS.seguridad, class: ANNOUNCEMENT_CATEGORY_COLORS.seguridad },
  financiero: { label: ANNOUNCEMENT_CATEGORY_LABELS.financiero, class: ANNOUNCEMENT_CATEGORY_COLORS.financiero },
  evento: { label: ANNOUNCEMENT_CATEGORY_LABELS.evento, class: ANNOUNCEMENT_CATEGORY_COLORS.evento },
  urgente: { label: ANNOUNCEMENT_CATEGORY_LABELS.urgente, class: ANNOUNCEMENT_CATEGORY_COLORS.urgente },
}

const categoryOptions: Array<{ value: AnnouncementCategory; label: string }> = [
  { value: 'general', label: 'General' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
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
  if (activeCategory.value) {
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

const clientNow = ref<number>(0)
onMounted(() => { clientNow.value = Date.now() })

function isNew(publishedAt: string | null): boolean {
  if (!publishedAt || !clientNow.value) return false
  const published = new Date(publishedAt).getTime()
  return clientNow.value - published < 24 * 60 * 60 * 1000
}
</script>

<template>
  <div>
    <!-- Topbar actions -->
    <Teleport :to="target" defer v-if="isMounted">
      <TopbarFilters :active="activeCategory !== ''" @clear="activeCategory = ''">
        <TopbarFilterGroup v-model="activeCategory" label="Categoria" :options="categoryOptions" />
      </TopbarFilters>
    </Teleport>

    <!-- Mobile filters -->
    <div class="mb-4 md:hidden">
      <TopbarFilters :active="activeCategory !== ''" @clear="activeCategory = ''">
        <TopbarFilterGroup v-model="activeCategory" label="Categoria" :options="categoryOptions" />
      </TopbarFilters>
    </div>

    <!-- Error -->
    <ErrorAlert v-if="error" :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="3" variant="card" />

    <!-- Content -->
    <template v-else-if="!error">
      <!-- Empty state -->
      <EmptyState
        v-if="announcements.length === 0"
        :icon="Megaphone"
        title="No hay anuncios"
        description="Los comunicados de la administracion apareceran aqui"
      />

      <!-- Announcement cards -->
      <div v-else class="space-y-2">
        <Card
          v-for="item in announcements"
          :key="item.id"
          class="cursor-pointer transition-colors hover:bg-muted/50"
          @click="toggleExpand(item.id)"
        >
          <CardContent class="px-3 py-2.5">
            <!-- Top row: badges + chevron -->
            <div class="flex items-start justify-between gap-2">
              <div class="flex flex-wrap items-center gap-1.5">
                <!-- NEW badge -->
                <span
                  v-if="isNew(item.publishedAt)"
                  class="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-700"
                >
                  <Sparkles class="size-3" />
                  Nuevo
                </span>
                <!-- Category badge -->
                <span
                  class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
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
              <p v-if="item.expiresAt" class="mt-2 text-xs text-muted-foreground">
                Vigente hasta: {{ formatDate(item.expiresAt) }}
              </p>
            </div>
          </CardContent>
        </Card>

        <!-- Pagination -->
        <ListPagination v-model:current-page="currentPage" :total-pages="totalPages" />
      </div>
    </template>
  </div>
</template>
