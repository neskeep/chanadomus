<script setup lang="ts">
import {
  FileText,
  FileDown,
  ExternalLink,
  BookOpen,
  Clock,
  Ruler,
} from 'lucide-vue-next'
import type { RegulationCategory } from '~~/shared/types/regulation'
import { REGULATION_CATEGORY_LABELS } from '~~/shared/types/regulation'

useHead({ title: 'Normativas' })

const { formatDate } = useFormatDate()
const { grouped, isLoading, error, fetchRegulations } = useRegulations()

const CATEGORY_CONFIG: Record<RegulationCategory, { icon: typeof BookOpen; badgeClass: string; description: string }> = {
  normas: {
    icon: BookOpen,
    badgeClass: 'bg-primary/10 text-primary',
    description: 'Reglas de convivencia del condominio',
  },
  horarios: {
    icon: Clock,
    badgeClass: 'bg-amber-100 text-amber-700',
    description: 'Horarios de servicios y áreas comunes',
  },
  arquitectura: {
    icon: Ruler,
    badgeClass: 'bg-violet-100 text-violet-700',
    description: 'Lineamientos para modificaciones y construcción',
  },
}

const categories: RegulationCategory[] = ['normas', 'horarios', 'arquitectura']

const hasAny = computed(() => categories.some(cat => grouped.value[cat].length > 0))

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
        v-if="!hasAny"
        :icon="FileText"
        title="No hay normativas"
        description="Las normativas del condominio aparecerán aquí cuando la administración las publique"
      />

      <!-- Categories -->
      <div v-else class="space-y-8">
        <template v-for="cat in categories" :key="cat">
          <section v-if="grouped[cat].length > 0">
            <!-- Category header -->
            <div class="mb-3 flex items-center gap-2">
              <div
                class="flex size-8 items-center justify-center rounded-lg"
                :class="CATEGORY_CONFIG[cat].badgeClass"
              >
                <component :is="CATEGORY_CONFIG[cat].icon" class="size-4" />
              </div>
              <div>
                <h2 class="text-sm font-semibold">{{ REGULATION_CATEGORY_LABELS[cat] }}</h2>
                <p class="text-xs text-muted-foreground">{{ CATEGORY_CONFIG[cat].description }}</p>
              </div>
              <Badge variant="secondary" class="ml-auto text-xs">
                {{ grouped[cat].length }}
              </Badge>
            </div>

            <!-- Documents list -->
            <div class="space-y-2">
              <Card
                v-for="item in grouped[cat]"
                :key="item.id"
              >
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
          </section>
        </template>
      </div>
    </template>
  </div>
</template>
