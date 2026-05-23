<script setup lang="ts">
import {
  FileText,
  FileDown,
  ExternalLink,
} from 'lucide-vue-next'

useHead({ title: 'Normativas' })

const { formatDate } = useFormatDate()
const { regulations, isLoading, error, fetchRegulations } = useRegulations()

onMounted(() => {
  fetchRegulations()
})
</script>

<template>
  <div>
    <!-- Error -->
    <ErrorAlert v-if="error" :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="3" variant="card" />

    <!-- Content -->
    <template v-else-if="!error">
      <!-- Empty state -->
      <EmptyState
        v-if="regulations.length === 0"
        :icon="FileText"
        title="No hay normativas"
        description="Las normativas del condominio aparecerán aquí cuando la administración las publique"
      />

      <!-- Documents list -->
      <div v-else class="space-y-2">
        <Card v-for="item in regulations" :key="item.id">
          <CardContent class="px-3 py-2.5">
            <!-- Row 1: Icon + Title -->
            <div class="flex items-center gap-2">
              <FileText class="size-4 shrink-0 text-muted-foreground" />
              <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ item.title }}</p>
            </div>
            <!-- Row 2: Date · Author | Actions -->
            <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
              <span class="shrink-0 tabular-nums">{{ formatDate(item.publishedAt) }}</span>
              <span v-if="item.authorName" class="opacity-30">&middot;</span>
              <span v-if="item.authorName" class="truncate">{{ item.authorName }}</span>
              <span class="ml-auto flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  class="h-6 px-2 text-[11px] text-primary hover:text-primary"
                  as="a"
                  :href="`/api/regulations/attachments/${item.attachmentPath}`"
                  target="_blank"
                  title="Ver PDF"
                >
                  <ExternalLink class="mr-1 size-3" />
                  Ver
                </Button>
                <Button
                  variant="ghost"
                  class="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  as="a"
                  :href="`/api/regulations/attachments/${item.attachmentPath}`"
                  download
                  title="Descargar PDF"
                >
                  <FileDown class="mr-1 size-3" />
                  Descargar
                </Button>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
