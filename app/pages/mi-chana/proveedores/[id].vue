<script setup lang="ts">
import {
  Star,
  Phone,
  MapPin,
  Clock,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Provider, ProviderCategory, ProviderReview, UpdateProvider } from '~~/shared/types/provider'
import { PROVIDER_CATEGORIES } from '~~/shared/types/provider'

definePageMeta({ layout: 'default' })

const { target, isMounted } = useTopbarPortal()
const route = useRoute()
const router = useRouter()

const { role } = useAuth()
const {
  isLoading,
  isSubmitting,
  error,
  fetchProvider,
  updateProvider,
  deleteProvider,
  submitReview,
} = useProviders()

const canManage = computed(() => role.value === 'admin' || role.value === 'conserje')
const canReview = computed(() => role.value === 'propietario')

const provider = ref<Provider | null>(null)

// Breadcrumb navigation (must be after provider ref)
const providerPageOverride = computed(() => {
  if (!provider.value) return null
  return {
    title: provider.value.name,
    breadcrumbs: [{ label: 'Proveedores', to: '/mi-chana/proveedores' }],
  }
})
usePageInfoOverride(providerPageOverride)
const providerId = computed(() => route.params.id as string)

// Edit dialog
const editOpen = ref(false)
const editName = ref('')
const editPhone = ref('')
const editCategory = ref<ProviderCategory>('otro')
const editAddress = ref('')
const editSchedule = ref('')
const editServices = ref('')
const editCosts = ref('')
const editNotes = ref('')

// Delete dialog
const deleteDialogOpen = ref(false)

// Review dialog
const reviewOpen = ref(false)
const reviewRating = ref(0)
const reviewHover = ref(0)
const reviewComment = ref('')

import { PROVIDER_CATEGORY_COLORS as CATEGORY_COLORS, PROVIDER_STATUS_COLORS, PROVIDER_STATUS_LABELS } from '~/composables/useColorMap'

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

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  active: { label: PROVIDER_STATUS_LABELS.active, class: PROVIDER_STATUS_COLORS.active },
  inactive: { label: PROVIDER_STATUS_LABELS.inactive, class: PROVIDER_STATUS_COLORS.inactive },
  pending: { label: PROVIDER_STATUS_LABELS.pending, class: PROVIDER_STATUS_COLORS.pending },
}

async function loadProvider() {
  try {
    provider.value = await fetchProvider(providerId.value)
  }
  catch {
    toast.error('No se pudo cargar el proveedor')
  }
}

onMounted(() => {
  loadProvider()
})

function renderStars(rating: number | undefined): number[] {
  const r = Math.round(rating ?? 0)
  return [1, 2, 3, 4, 5].map(i => (i <= r ? 1 : 0))
}

const { formatDate } = useFormatDate()

// Edit handlers
function openEditDialog() {
  if (!provider.value) return
  editName.value = provider.value.name
  editPhone.value = provider.value.phone ?? ''
  editCategory.value = provider.value.category
  editAddress.value = provider.value.address ?? ''
  editSchedule.value = provider.value.schedule ?? ''
  editServices.value = provider.value.services?.join('\n') ?? ''
  editCosts.value = provider.value.costs ?? ''
  editNotes.value = provider.value.notes ?? ''
  editOpen.value = true
}

const canSubmitEdit = computed(() =>
  editName.value.trim().length > 0 && !isSubmitting.value,
)

async function handleEdit() {
  if (!canSubmitEdit.value) return
  try {
    const data: UpdateProvider = {
      name: editName.value.trim(),
      phone: editPhone.value.trim() || null,
      category: editCategory.value,
      address: editAddress.value.trim() || null,
      schedule: editSchedule.value.trim() || null,
      services: editServices.value.trim()
        ? editServices.value.trim().split('\n').filter(Boolean)
        : null,
      costs: editCosts.value.trim() || null,
      notes: editNotes.value.trim() || null,
    }
    provider.value = await updateProvider(providerId.value, data)
    toast.success('Proveedor actualizado')
    editOpen.value = false
  }
  catch {
    toast.error(error.value ?? 'Error al actualizar proveedor')
  }
}

// Delete handler
async function handleDelete() {
  try {
    await deleteProvider(providerId.value)
    toast.success('Proveedor eliminado')
    deleteDialogOpen.value = false
    router.push('/mi-chana/proveedores')
  }
  catch {
    toast.error(error.value ?? 'Error al eliminar proveedor')
  }
}

// Review handlers
function openReviewDialog() {
  reviewRating.value = 0
  reviewHover.value = 0
  reviewComment.value = ''
  reviewOpen.value = true
}

const canSubmitReview = computed(() =>
  reviewRating.value > 0 && !isSubmitting.value,
)

async function handleReview() {
  if (!canSubmitReview.value) return
  try {
    const review = await submitReview(providerId.value, {
      rating: reviewRating.value,
      comment: reviewComment.value.trim() || undefined,
    })
    toast.success('Resena enviada')
    reviewOpen.value = false
    // Reload to get updated reviews/rating
    await loadProvider()
  }
  catch {
    toast.error(error.value ?? 'Error al enviar resena')
  }
}
</script>

<template>
  <div>
    <Teleport :to="target" defer v-if="isMounted">
      <template v-if="canManage && provider">
        <Button variant="outline" size="sm" @click="openEditDialog">
          <Pencil class="mr-1.5 size-3.5" />
          Editar
        </Button>
        <Button variant="outline" size="sm" class="text-destructive hover:text-destructive" @click="deleteDialogOpen = true">
          <Trash2 class="mr-1.5 size-3.5" />
          Eliminar
        </Button>
      </template>
    </Teleport>

    <!-- Mobile actions -->
    <TopbarMobileAction>
      <template v-if="canManage && provider">
        <Button size="icon" variant="ghost" class="size-9" @click="openEditDialog">
          <Pencil class="size-4" />
        </Button>
        <Button size="icon" variant="ghost" class="size-9 text-destructive" @click="deleteDialogOpen = true">
          <Trash2 class="size-4" />
        </Button>
      </template>
    </TopbarMobileAction>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <Skeleton class="h-6 w-3/4" />
      <div class="flex gap-2">
        <Skeleton class="h-5 w-20 rounded-lg" />
        <Skeleton class="h-5 w-16 rounded-lg" />
      </div>
      <Skeleton class="h-4 w-1/2" />
      <Skeleton class="h-4 w-2/3" />
      <Skeleton class="h-4 w-1/3" />
    </div>

    <!-- Error -->
    <div v-else-if="error && !provider" class="space-y-4">
      <ErrorAlert :message="error" />
      <div class="text-center">
        <Button size="sm" variant="outline" @click="navigateTo('/mi-chana/proveedores')">Volver al directorio</Button>
      </div>
    </div>

    <!-- Provider detail -->
    <template v-else-if="provider">
      <!-- Main card -->
      <Card>
        <CardContent class="p-4 space-y-3">
          <!-- Name -->
          <h2 class="text-xl font-bold leading-snug">{{ provider.name }}</h2>

          <!-- Badges -->
          <div class="flex flex-wrap gap-2">
            <span
              class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
              :class="CATEGORY_COLORS[provider.category]"
            >
              {{ provider.serviceRoleName ?? CATEGORY_LABELS[provider.category] }}
            </span>
            <span
              class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
              :class="STATUS_LABELS[provider.status]?.class ?? 'bg-zinc-100 text-zinc-600'"
            >
              {{ STATUS_LABELS[provider.status]?.label ?? provider.status }}
            </span>
          </div>

          <!-- Phone -->
          <div v-if="provider.phone" class="flex items-center gap-2 text-sm">
            <Phone class="size-4 shrink-0 text-muted-foreground" />
            <a
              :href="`tel:${provider.phone}`"
              class="text-primary underline-offset-2 hover:underline"
            >
              {{ provider.phone }}
            </a>
          </div>

          <!-- Address -->
          <div v-if="provider.address" class="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin class="size-4 shrink-0" />
            <span>{{ provider.address }}</span>
          </div>

          <!-- Schedule -->
          <div v-if="provider.schedule" class="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock class="size-4 shrink-0" />
            <span>{{ provider.schedule }}</span>
          </div>

          <!-- Services -->
          <div v-if="provider.services && provider.services.length > 0">
            <p class="mb-1.5 text-xs font-medium text-muted-foreground">Servicios</p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="service in provider.services"
                :key="service"
                class="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs"
              >
                {{ service }}
              </span>
            </div>
          </div>

          <!-- Costs -->
          <div v-if="provider.costs">
            <p class="mb-1 text-xs font-medium text-muted-foreground">Costos</p>
            <p class="text-sm">{{ provider.costs }}</p>
          </div>

          <!-- Notes -->
          <div v-if="provider.notes">
            <p class="mb-1 text-xs font-medium text-muted-foreground">Notas</p>
            <p class="text-sm text-muted-foreground">{{ provider.notes }}</p>
          </div>
        </CardContent>
      </Card>

      <Separator class="my-6" />

      <!-- Reviews section -->
      <div>
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold">Resenas</h3>
            <div class="mt-1 flex items-center gap-2">
              <div class="flex items-center gap-0.5">
                <Star
                  v-for="(filled, idx) in renderStars(provider.averageRating)"
                  :key="idx"
                  class="size-4"
                  :class="filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'"
                />
              </div>
              <span class="text-sm text-muted-foreground">
                {{ provider.averageRating?.toFixed(1) ?? '0.0' }}
                ({{ provider.reviewCount ?? 0 }} {{ (provider.reviewCount ?? 0) === 1 ? 'resena' : 'resenas' }})
              </span>
            </div>
          </div>
          <Button v-if="canReview" size="sm" @click="openReviewDialog">
            <Star class="mr-1.5 size-4" />
            Dejar Resena
          </Button>
        </div>

        <!-- Reviews list -->
        <div v-if="provider.reviews && provider.reviews.length > 0" class="space-y-3">
          <Card v-for="review in provider.reviews" :key="review.id">
            <CardContent class="p-3">
              <div class="flex items-center gap-1">
                <Star
                  v-for="(filled, idx) in renderStars(review.rating)"
                  :key="idx"
                  class="size-3.5"
                  :class="filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'"
                />
              </div>
              <p v-if="review.comment" class="mt-1.5 text-sm text-muted-foreground">
                {{ review.comment }}
              </p>
              <p class="mt-1.5 text-xs text-muted-foreground">
                {{ review.reviewerName ?? 'Anonimo' }} · {{ formatDate(review.createdAt) }}
              </p>
            </CardContent>
          </Card>
        </div>

        <EmptyState
          v-else
          :icon="Star"
          title="Aún no hay reseñas"
        />
      </div>
    </template>

    <!-- Edit Dialog -->
    <Dialog v-model:open="editOpen">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Proveedor</DialogTitle>
          <DialogDescription>Modifica los datos del proveedor</DialogDescription>
        </DialogHeader>

        <form class="space-y-4 py-2" @submit.prevent="handleEdit">
          <div class="space-y-2">
            <Label for="edit-name">Nombre</Label>
            <Input id="edit-name" v-model="editName" placeholder="Nombre del proveedor" required />
          </div>

          <div class="space-y-2">
            <Label for="edit-phone">Telefono</Label>
            <Input id="edit-phone" v-model="editPhone" placeholder="0412-1234567" />
          </div>

          <div class="space-y-2">
            <Label for="edit-category">Categoria</Label>
            <Select v-model="editCategory">
              <SelectTrigger id="edit-category">
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
            <Label for="edit-address">Direccion</Label>
            <Input id="edit-address" v-model="editAddress" placeholder="Direccion del proveedor" />
          </div>

          <div class="space-y-2">
            <Label for="edit-schedule">Horario</Label>
            <Input id="edit-schedule" v-model="editSchedule" placeholder="Lun-Vie 8:00-17:00" />
          </div>

          <div class="space-y-2">
            <Label for="edit-services">Servicios (uno por linea)</Label>
            <Textarea
              id="edit-services"
              v-model="editServices"
              placeholder="Reparacion de tuberias&#10;Destape de drenajes"
              rows="3"
            />
          </div>

          <div class="space-y-2">
            <Label for="edit-costs">Costos</Label>
            <Textarea id="edit-costs" v-model="editCosts" placeholder="Descripcion de costos..." rows="2" />
          </div>

          <div class="space-y-2">
            <Label for="edit-notes">Notas</Label>
            <Textarea id="edit-notes" v-model="editNotes" placeholder="Notas adicionales..." rows="2" />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" @click="editOpen = false">Cancelar</Button>
            <Button type="submit" :disabled="!canSubmitEdit">
              <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
              {{ isSubmitting ? 'Guardando...' : 'Guardar cambios' }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Delete AlertDialog -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar proveedor</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion no se puede deshacer. El proveedor y todas sus resenas seran eliminados permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="handleDelete"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Review Dialog -->
    <Dialog v-model:open="reviewOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dejar Resena</DialogTitle>
          <DialogDescription>Comparte tu experiencia con {{ provider?.name }}</DialogDescription>
        </DialogHeader>

        <form class="space-y-4 py-2" @submit.prevent="handleReview">
          <!-- Star rating selector -->
          <div class="space-y-2">
            <Label>Calificacion</Label>
            <div class="flex items-center gap-1">
              <button
                v-for="i in 5"
                :key="i"
                type="button"
                class="rounded-sm p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                @click="reviewRating = i"
                @mouseenter="reviewHover = i"
                @mouseleave="reviewHover = 0"
              >
                <Star
                  class="size-7"
                  :class="
                    (reviewHover || reviewRating) >= i
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  "
                />
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="review-comment">Comentario (opcional)</Label>
            <Textarea
              id="review-comment"
              v-model="reviewComment"
              placeholder="Describe tu experiencia..."
              rows="3"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" @click="reviewOpen = false">Cancelar</Button>
            <Button type="submit" :disabled="!canSubmitReview">
              <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
              {{ isSubmitting ? 'Enviando...' : 'Enviar resena' }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
