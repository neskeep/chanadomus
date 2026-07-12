<script setup lang="ts">
import { ScrollText } from 'lucide-vue-next'
import type { ChangelogItemType } from '~~/shared/types/changelog'
import { CHANGELOG_TYPE_COLORS, CHANGELOG_TYPE_LABELS } from '~/composables/useColorMap'

useHead({ title: 'Changelog' })

const { entries, isLoading, error, totalPages, fetchEntries } = useChangelog()
const currentPage = ref(1)

watch(currentPage, (page) => {
  fetchEntries({ page })
})

onMounted(() => {
  fetchEntries()
})

const { formatDate } = useFormatDate()
</script>

<template>
  <div>
    <!-- Error -->
    <ErrorAlert :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="3" />

    <!-- Content -->
    <template v-else-if="!error">
      <!-- Empty state -->
      <EmptyState
        v-if="entries.length === 0"
        :icon="ScrollText"
        title="Sin novedades"
        description="Las actualizaciones de la plataforma aparecerán aquí"
      />

      <!-- Changelog entries -->
      <div v-else>
        <div class="space-y-3">
          <Card v-for="entry in entries" :key="entry.id">
            <CardContent class="p-4 md:p-6">
              <div class="flex items-baseline justify-between gap-2">
                <div class="flex items-baseline gap-2">
                  <span class="text-base font-bold">v{{ entry.version }}</span>
                  <span class="text-sm text-muted-foreground">{{ entry.title }}</span>
                </div>
                <span class="shrink-0 text-xs tabular-nums text-muted-foreground">{{ formatDate(entry.publishedAt) }}</span>
              </div>
              <div class="mt-3 space-y-1.5">
                <div v-for="(change, i) in entry.changes" :key="i" class="flex items-start gap-2">
                  <span
                    class="mt-0.5 inline-flex shrink-0 rounded-lg px-1.5 py-0.5 text-[10px] font-medium"
                    :class="CHANGELOG_TYPE_COLORS[change.type as ChangelogItemType]"
                  >
                    {{ CHANGELOG_TYPE_LABELS[change.type as ChangelogItemType] }}
                  </span>
                  <span class="text-sm">{{ change.description }}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Pagination -->
        <ListPagination v-model:current-page="currentPage" :total-pages="totalPages" class="mt-4" />
      </div>
    </template>
  </div>
</template>
