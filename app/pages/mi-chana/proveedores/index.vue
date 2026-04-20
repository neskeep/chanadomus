<script setup lang="ts">
import {
  Search,
  Star,
  Phone,
  Wrench,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { ProviderCategory } from '~~/shared/types/provider'
import { PROVIDER_CATEGORIES } from '~~/shared/types/provider'

definePageMeta({ layout: 'default', title: 'Directorio de Proveedores' })

const { role } = useAuth()
const {
  providers,
  meta,
  isLoading,
  isSubmitting,
  error,
  totalPages,
  fetchProviders,
  suggestProvider,
} = useProviders()

const canCreate = computed(() => role.value === 'admin' || role.value === 'conserje')

// Filters & pagination
const currentPage = ref(1)
const searchQuery = ref('')
const filterCategory = ref<ProviderCategory | 'all'>('all')
const showFilters = ref(false)

// Suggest dialog
const suggestOpen = ref(false)
const suggestName = ref('')
const suggestPhone = ref('')
const suggestCategory = ref<ProviderCategory>('otro')
const suggestNote = ref('')

const CATEGORY_COLORS: Record<ProviderCategory, string> = {
  plomeria: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  electricidad: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  jardineria: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cerrajeria: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  limpieza: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  pintura: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  albanileria: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  seguridad: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  fumigacion: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  otro: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
}

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
  if (filterCategory.value && filterCategory.value !== 'all') params.category = filterCategory.value
  await fetchProviders(params)
}

watch([currentPage, filterCategory], () => {
  loadProviders()
})

onMounted(() => {
  loadProviders()
})

function resetSuggestForm() {
  suggestName.value = ''
  suggestPhone.value = ''
  suggestCategory.value = 'otro'
  suggestNote.value = ''
}

function openSuggestDialog() {
  resetSuggestForm()
  suggestOpen.value = true
}

const canSuggest = computed(() =>
  suggestName.value.trim().length > 0 && !isSubmitting.value,
)

async function handleSuggest() {
  if (!canSuggest.value) return
  try {
    await suggestProvider({
      name: suggestName.value.trim(),
      phone: suggestPhone.value.trim() || undefined,
      category: suggestCategory.value,
      notes: suggestNote.value.trim() || undefined,
    })
    toast.success('Sugerencia enviada. El administrador la revisara.')
    suggestOpen.value = false
  }
  catch {
    toast.error(error.value ?? 'Error al enviar sugerencia')
  }
}

function renderStars(rating: number | undefined): number[] {
  const r = Math.round(rating ?? 0)
  return [1, 2, 3, 4, 5].map(i => (i <= r ? 1 : 0))
}
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <!-- Error -->
    <div
      v-if="error"
      role="alert"
      class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <!-- Search & filters -->
    <div class="mb-4 space-y-3">
      <div class="flex gap-2">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Buscar por nombre o servicio..."
            class="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          :class="{ 'border-primary text-primary': showFilters }"
          @click="showFilters = !showFilters"
        >
          <Filter class="size-4" />
        </Button>
      </div>

      <!-- Filter selects -->
      <div v-if="showFilters" class="grid grid-cols-1 gap-3">
        <Select v-model="filterCategory">
          <SelectTrigger>
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem v-for="cat in PROVIDER_CATEGORIES" :key="cat.key" :value="cat.key">
              {{ cat.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="i in 6" :key="i">
        <CardContent class="p-4">
          <div class="space-y-3">
            <Skeleton class="h-5 w-3/4" />
            <Skeleton class="h-5 w-20 rounded-full" />
            <Skeleton class="h-4 w-1/2" />
            <Skeleton class="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filteredProviders.length === 0"
      class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"
    >
      <div class="flex size-12 items-center justify-center rounded-full bg-muted">
        <Wrench class="size-6 text-muted-foreground" />
      </div>
      <div>
        <p class="font-medium">No hay proveedores</p>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ filterCategory !== 'all' ? 'Prueba cambiando los filtros' : 'Los proveedores apareceran aqui' }}
        </p>
      </div>
      <Button v-if="role === 'propietario'" size="sm" variant="outline" @click="openSuggestDialog">
        Sugerir proveedor
      </Button>
    </div>

    <!-- Provider grid -->
    <div v-else>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="provider in filteredProviders"
          :key="provider.id"
          :to="`/mi-chana/proveedores/${provider.id}`"
          class="block"
        >
          <Card class="h-full transition-shadow hover:shadow-md">
            <CardContent class="p-4">
              <!-- Name -->
              <p class="text-sm font-semibold leading-snug">{{ provider.name }}</p>

              <!-- Category badge -->
              <div class="mt-2">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
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
      <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between">
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

    <!-- Suggest button for propietarios -->
    <div v-if="role === 'propietario' && !isLoading && filteredProviders.length > 0" class="mt-6 text-center">
      <Button variant="outline" size="sm" @click="openSuggestDialog">
        <Plus class="mr-1.5 size-4" />
        Sugerir Proveedor
      </Button>
    </div>

    <!-- FAB for admin/conserje -->
    <NuxtLink
      v-if="canCreate"
      to="/admin/proveedores"
      class="fixed bottom-20 left-4 z-50 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-6"
      aria-label="Gestionar proveedores"
    >
      <Plus class="size-5" />
    </NuxtLink>

    <!-- Suggest Dialog -->
    <Dialog v-model:open="suggestOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sugerir Proveedor</DialogTitle>
          <DialogDescription>
            Sugiere un proveedor de confianza. El administrador lo revisara.
          </DialogDescription>
        </DialogHeader>

        <form class="space-y-4 py-2" @submit.prevent="handleSuggest">
          <div class="space-y-2">
            <Label for="suggest-name">Nombre</Label>
            <Input
              id="suggest-name"
              v-model="suggestName"
              placeholder="Nombre del proveedor"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="suggest-phone">Telefono (opcional)</Label>
            <Input
              id="suggest-phone"
              v-model="suggestPhone"
              placeholder="0412-1234567"
            />
          </div>

          <div class="space-y-2">
            <Label for="suggest-category">Categoria</Label>
            <Select v-model="suggestCategory">
              <SelectTrigger id="suggest-category">
                <SelectValue placeholder="Seleccionar categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="cat in PROVIDER_CATEGORIES" :key="cat.key" :value="cat.key">
                  {{ cat.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="suggest-note">Nota (opcional)</Label>
            <Textarea
              id="suggest-note"
              v-model="suggestNote"
              placeholder="Comentarios adicionales..."
              rows="2"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" @click="suggestOpen = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="!canSuggest">
              <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
              {{ isSubmitting ? 'Enviando...' : 'Enviar sugerencia' }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
