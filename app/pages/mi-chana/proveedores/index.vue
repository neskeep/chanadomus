<script setup lang="ts">
import {
  Star,
  Phone,
  Wrench,
  Plus,
} from 'lucide-vue-next'
import type { ProviderCategory } from '~~/shared/types/provider'
import { PROVIDER_CATEGORIES } from '~~/shared/types/provider'
import { PROVIDER_CATEGORY_COLORS as CATEGORY_COLORS } from '~/composables/useColorMap'

useHead({ title: 'Directorio de Proveedores' })

const { target, isMounted } = useTopbarPortal()
const { role } = useAuth()
const {
  providers,
  meta,
  isLoading,
  error,
  totalPages,
  fetchProviders,
} = useProviders()

const canCreate = computed(() => role.value === 'admin' || role.value === 'conserje')

// Filters & pagination
const currentPage = ref(1)
const searchQuery = ref('')
const filterCategory = ref<ProviderCategory | ''>('')

const categoryOptions = computed(() => [
  ...PROVIDER_CATEGORIES.map(c => ({ value: c.key as ProviderCategory | '', label: c.label })),
])

const CATEGORY_LABELS: Record<ProviderCategory, string> = {
  plomeria: 'Plomeria',
  electricidad: 'Electricidad',
  jardineria: 'Jardineria',
  cerrajeria: 'Cerrajeria',
  limpieza: 'Limpieza',
  pintura: 'Pintura',
  albanileria: 'Albanileria',
  seguridad: 'Seguridad',
  fumigacion: 'Fumigacion',
  otro: 'Otro',
}

// Client-side search filter
const filteredProviders = computed(() => {
  if (!searchQuery.value.trim()) return providers.value
  const q = searchQuery.value.trim().toLowerCase()
  return providers.value.filter(p =>
    p.name.toLowerCase().includes(q)
    || p.category.toLowerCase().includes(q)
    || p.services?.some(s => s.toLowerCase().includes(q)),
  )
})

async function loadProviders() {
  const params: { page?: number; category?: ProviderCategory; status?: 'active' } = {
    page: currentPage.value,
    status: 'active',
  }
  if (filterCategory.value) params.category = filterCategory.value
  await fetchProviders(params)
}

watch([currentPage, filterCategory], () => {
  loadProviders()
})

onMounted(() => {
  loadProviders()
})

function renderStars(rating: number | undefined): number[] {
  const r = Math.round(rating ?? 0)
  return [1, 2, 3, 4, 5].map(i => (i <= r ? 1 : 0))
}
</script>

<template>
  <div>
    <Teleport v-if="isMounted" :to="target" defer>
      <TopbarSearch v-model="searchQuery" placeholder="Buscar proveedor...">
        <TopbarFilters :active="filterCategory !== ''" @clear="filterCategory = ''">
          <TopbarFilterGroup v-model="filterCategory" label="Categoria" :options="categoryOptions" />
        </TopbarFilters>
      </TopbarSearch>
      <Button v-if="role === 'propietario'" size="sm" variant="outline" @click="navigateTo('/mi-chana/proveedores/sugerir')">
        <Plus class="mr-1.5 size-3.5" />
        Sugerir
      </Button>
      <Button v-if="canCreate" size="sm" @click="navigateTo(role === 'admin' ? '/admin/proveedores' : '/mi-chana/proveedores/crear')">
        <Plus class="mr-1.5 size-3.5" />
        {{ role === 'admin' ? 'Gestionar' : 'Crear' }}
      </Button>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button v-if="role === 'propietario'" size="icon" variant="ghost" class="size-9" @click="navigateTo('/mi-chana/proveedores/sugerir')">
        <Plus class="size-4" />
      </Button>
      <Button v-else-if="canCreate" size="icon" variant="ghost" class="size-9" @click="navigateTo(role === 'admin' ? '/admin/proveedores' : '/mi-chana/proveedores/crear')">
        <Plus class="size-4" />
      </Button>
    </TopbarMobileAction>

    <!-- Mobile search -->
    <div class="mb-4 md:hidden">
      <TopbarSearch v-model="searchQuery" placeholder="Buscar proveedor...">
        <TopbarFilters :active="filterCategory !== ''" @clear="filterCategory = ''">
          <TopbarFilterGroup v-model="filterCategory" label="Categoria" :options="categoryOptions" />
        </TopbarFilters>
      </TopbarSearch>
    </div>

    <!-- Error -->
    <ErrorAlert :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="6" variant="row" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="filteredProviders.length === 0"
      :icon="Wrench"
      title="No hay proveedores"
      :description="filterCategory ? 'Prueba cambiando los filtros' : 'Los proveedores aparecerán aquí'"
    >
      <template v-if="role === 'propietario'" #action>
        <Button size="sm" variant="outline" @click="navigateTo('/mi-chana/proveedores/sugerir')">
          Sugerir proveedor
        </Button>
      </template>
    </EmptyState>

    <div v-else>
      <!-- Desktop table -->
      <div class="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Telefono</TableHead>
              <TableHead>Servicios</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="provider in filteredProviders"
              :key="provider.id"
              class="cursor-pointer"
              @click="navigateTo(`/mi-chana/proveedores/${provider.id}`)"
            >
              <TableCell class="font-medium">{{ provider.name }}</TableCell>
              <TableCell>
                <span
                  class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                  :class="CATEGORY_COLORS[provider.category]"
                >
                  {{ provider.serviceRoleName ?? CATEGORY_LABELS[provider.category] }}
                </span>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1">
                  <Star
                    v-for="(filled, idx) in renderStars(provider.averageRating)"
                    :key="idx"
                    class="size-3"
                    :class="filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'"
                  />
                  <span class="ml-1 text-xs text-muted-foreground">({{ provider.reviewCount ?? 0 }})</span>
                </div>
              </TableCell>
              <TableCell class="text-muted-foreground">
                {{ provider.phone ?? '—' }}
              </TableCell>
              <TableCell>
                <p v-if="provider.services && provider.services.length > 0" class="max-w-xs truncate text-xs text-muted-foreground">
                  {{ provider.services.join(', ') }}
                </p>
                <span v-else class="text-xs text-muted-foreground">—</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile cards -->
      <div class="space-y-2 md:hidden">
        <NuxtLink
          v-for="provider in filteredProviders"
          :key="provider.id"
          :to="`/mi-chana/proveedores/${provider.id}`"
          class="block"
        >
          <Card class="transition-colors hover:bg-muted/50">
            <CardContent class="px-3 py-2.5">
              <!-- Row 1: Name + category -->
              <div class="flex items-center gap-2">
                <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ provider.name }}</p>
                <span
                  class="inline-flex shrink-0 rounded-lg px-1.5 py-0.5 text-[11px] font-medium"
                  :class="CATEGORY_COLORS[provider.category]"
                >
                  {{ provider.serviceRoleName ?? CATEGORY_LABELS[provider.category] }}
                </span>
              </div>
              <!-- Row 2: Rating · Phone · Services -->
              <div class="mt-1 flex items-center gap-x-1.5 text-[11px] text-muted-foreground">
                <div class="flex items-center gap-0.5">
                  <Star
                    v-for="(filled, idx) in renderStars(provider.averageRating)"
                    :key="idx"
                    class="size-2.5"
                    :class="filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'"
                  />
                  <span class="ml-0.5">({{ provider.reviewCount ?? 0 }})</span>
                </div>
                <template v-if="provider.phone">
                  <span class="opacity-30">&middot;</span>
                  <div class="flex items-center gap-1">
                    <Phone class="size-3 shrink-0" />
                    <span class="tabular-nums">{{ provider.phone }}</span>
                  </div>
                </template>
                <template v-if="provider.services && provider.services.length > 0">
                  <span class="opacity-30">&middot;</span>
                  <span class="truncate">{{ provider.services.join(', ') }}</span>
                </template>
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
