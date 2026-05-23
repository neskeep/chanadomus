<script setup lang="ts">
import {
  Star,
  Phone,
  Wrench,
  Plus,
} from 'lucide-vue-next'
import type { ProviderCategory } from '~~/shared/types/provider'
import { PROVIDER_CATEGORIES } from '~~/shared/types/provider'

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

import { PROVIDER_CATEGORY_COLORS as CATEGORY_COLORS } from '~/composables/useColorMap'

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
    <Teleport :to="target" defer v-if="isMounted">
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
    <ListSkeleton v-if="isLoading" :count="6" />

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

    <!-- Provider grid -->
    <div v-else>
      <div class="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="provider in filteredProviders"
          :key="provider.id"
          :to="`/mi-chana/proveedores/${provider.id}`"
          class="block"
        >
          <Card class="h-full transition-colors hover:bg-muted/50">
            <CardContent class="p-3">
              <!-- Name -->
              <p class="text-sm font-semibold leading-snug">{{ provider.name }}</p>

              <!-- Category badge -->
              <div class="mt-2">
                <span
                  class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                  :class="CATEGORY_COLORS[provider.category]"
                >
                  {{ CATEGORY_LABELS[provider.category] }}
                </span>
              </div>

              <!-- Rating -->
              <div class="mt-2 flex items-center gap-1">
                <Star
                  v-for="(filled, idx) in renderStars(provider.averageRating)"
                  :key="idx"
                  class="size-3.5"
                  :class="filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'"
                />
                <span class="ml-1 text-xs text-muted-foreground">
                  ({{ provider.reviewCount ?? 0 }})
                </span>
              </div>

              <!-- Phone -->
              <div v-if="provider.phone" class="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone class="size-3.5 shrink-0" />
                <span>{{ provider.phone }}</span>
              </div>

              <!-- Services preview -->
              <p
                v-if="provider.services && provider.services.length > 0"
                class="mt-2 line-clamp-2 text-xs text-muted-foreground"
              >
                {{ provider.services.join(', ') }}
              </p>
            </CardContent>
          </Card>
        </NuxtLink>
      </div>

      <!-- Pagination -->
      <ListPagination v-model:current-page="currentPage" :total-pages="totalPages" class="mt-4" />
    </div>

  </div>
</template>
