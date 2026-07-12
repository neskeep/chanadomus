<script setup lang="ts">
import {
  ScrollText,
  Plus,
} from 'lucide-vue-next'

useHead({ title: 'Gestión de Changelog' })

const { entries, isLoading, error, totalPages, fetchEntries } = useChangelog()

const { target, isMounted } = useTopbarPortal()

const currentPage = ref(1)

async function loadEntries() {
  await fetchEntries({ page: currentPage.value })
}

watch(currentPage, () => {
  loadEntries()
})

onMounted(() => {
  loadEntries()
})

const { formatDate } = useFormatDate()
</script>

<template>
  <div>
    <!-- Topbar action: desktop "Nueva entrada" button -->
    <Teleport v-if="isMounted" :to="target" defer>
      <NuxtLink to="/admin/changelog/crear">
        <Button size="sm" class="gap-1.5">
          <Plus class="size-4" />
          Nueva entrada
        </Button>
      </NuxtLink>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" as-child>
        <NuxtLink to="/admin/changelog/crear">
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
      v-else-if="entries.length === 0"
      :icon="ScrollText"
      title="Sin entradas"
      description="Publica la primera versión del changelog"
    />

    <!-- Table (desktop) / Cards (mobile) -->
    <div v-else>
      <!-- Desktop table -->
      <div class="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Versión</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Cambios</TableHead>
              <TableHead>Publicado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="entry in entries"
              :key="entry.id"
            >
              <TableCell>
                <NuxtLink :to="`/admin/changelog/${entry.id}`" class="font-bold text-primary underline-offset-2 hover:underline">
                  v{{ entry.version }}
                </NuxtLink>
              </TableCell>
              <TableCell class="max-w-[250px] truncate">
                {{ entry.title }}
              </TableCell>
              <TableCell>
                <span class="inline-flex rounded-lg bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                  {{ entry.changes.length }}
                </span>
              </TableCell>
              <TableCell class="text-muted-foreground">{{ formatDate(entry.publishedAt) }}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" as-child>
                  <NuxtLink :to="`/admin/changelog/${entry.id}`">
                    Editar
                  </NuxtLink>
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile cards -->
      <div class="space-y-2 md:hidden">
        <NuxtLink v-for="entry in entries" :key="entry.id" :to="`/admin/changelog/${entry.id}`">
          <Card class="transition-colors hover:bg-muted/50">
            <CardContent class="px-3 py-2.5">
              <!-- Row 1: Version + Title + Date -->
              <div class="flex items-center gap-1.5">
                <span class="shrink-0 text-sm font-bold text-primary">v{{ entry.version }}</span>
                <p class="min-w-0 flex-1 truncate text-sm">{{ entry.title }}</p>
                <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">{{ formatDate(entry.publishedAt) }}</span>
              </div>
              <!-- Row 2: Changes count -->
              <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
                <span class="inline-flex rounded-lg bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                  {{ entry.changes.length }} cambios
                </span>
              </div>
            </CardContent>
          </Card>
        </NuxtLink>
      </div>

      <!-- Pagination -->
      <ListPagination v-model:current-page="currentPage" :total-pages="totalPages" class="mt-4" />
    </div>
  </div>
</template>
