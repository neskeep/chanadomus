<script setup lang="ts">
import { Loader2, Paperclip, Calendar } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Announcement, AnnouncementCategory, AnnouncementStatus } from '~~/shared/types/announcement'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const {
  isLoading,
  isSubmitting,
  error,
  fetchAnnouncement,
  updateAnnouncement,
} = useAnnouncements()

useHead({ title: 'Editar Anuncio' })

// --- Form state ---
const formTitle = ref('')
const formBody = ref('')
const formCategory = ref<AnnouncementCategory>('general')
const formStatus = ref<AnnouncementStatus>('draft')
const formExpiresAt = ref('')
const loaded = ref(false)

const canSubmit = computed(() =>
  formTitle.value.trim().length > 0
  && formBody.value.trim().length > 0
  && !isSubmitting.value,
)

async function loadAnnouncement() {
  try {
    const announcement = await fetchAnnouncement(id)
    formTitle.value = announcement.title
    formBody.value = announcement.body
    formCategory.value = announcement.category
    formStatus.value = announcement.status
    formExpiresAt.value = announcement.expiresAt?.split('T')[0] ?? ''
    loaded.value = true
  }
  catch {
    // error is set by composable
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    const data: Partial<Pick<Announcement, 'title' | 'body' | 'category' | 'status' | 'expiresAt'>> = {
      title: formTitle.value.trim(),
      body: formBody.value.trim(),
      category: formCategory.value,
      status: formStatus.value,
    }
    if (formExpiresAt.value) data.expiresAt = formExpiresAt.value
    await updateAnnouncement(id, data)
    toast.success('Anuncio actualizado correctamente')
    router.push('/admin/cartelera')
  }
  catch {
    toast.error(error.value ?? 'Error al guardar anuncio')
  }
}

onMounted(() => {
  loadAnnouncement()
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading && !loaded" class="space-y-4">
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-32 w-full" />
      <Skeleton class="h-12 w-1/2" />
    </div>

    <!-- Error -->
    <ErrorAlert v-else-if="error && !loaded" :message="error" />

    <!-- Form -->
    <Card v-else>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Error -->
          <ErrorAlert v-if="error" :message="error" />

          <!-- Título -->
          <div class="space-y-1.5">
            <Label for="ann-title">Título <span class="text-destructive">*</span></Label>
            <Input
              id="ann-title"
              v-model="formTitle"
              placeholder="Título del anuncio"
              class="h-12 text-base"
              required
            />
          </div>

          <!-- Cuerpo -->
          <div class="space-y-1.5">
            <Label for="ann-body">Contenido <span class="text-destructive">*</span></Label>
            <Textarea
              id="ann-body"
              v-model="formBody"
              placeholder="Contenido del anuncio..."
              rows="6"
              class="text-base"
              required
            />
          </div>

          <!-- Categoría + Estado row -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="ann-category">Categoría</Label>
              <Select v-model="formCategory">
                <SelectTrigger id="ann-category" size="lg" class="text-base">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="seguridad">Seguridad</SelectItem>
                  <SelectItem value="financiero">Financiero</SelectItem>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1.5">
              <Label for="ann-status">Estado</Label>
              <Select v-model="formStatus">
                <SelectTrigger id="ann-status" size="lg" class="text-base">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Fecha de expiración -->
          <div class="space-y-1.5">
            <Label for="ann-expires">Fecha de expiración</Label>
            <div class="relative">
              <Calendar class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="ann-expires"
                v-model="formExpiresAt"
                type="date"
                class="h-12 pl-9 text-base"
              />
            </div>
            <p class="text-xs text-muted-foreground">Se archiva automáticamente en esta fecha</p>
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Guardando...' : 'Guardar cambios' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
