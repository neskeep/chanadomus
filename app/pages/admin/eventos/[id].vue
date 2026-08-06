<script setup lang="ts">
import {
  CheckCircle,
  Trash2,
  Plus,
  Users,
  Calendar,
  Clock,
  Home,
  User,
  FileText,
  Upload,
  Search,
  Car,
  IdCard,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { EventDetail, EventStatus, GuestStatus, CreateGuest } from '~~/shared/types/event'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const {
  isLoading,
  isSubmitting,
  error,
  fetchEvent,
  approveEvent,
  deleteEvent,
} = useEvents()

const {
  guests,
  isLoading: guestsLoading,
  isSubmitting: guestsSubmitting,
  error: guestsError,
  fetchGuests,
  addGuests,
  removeGuest,
} = useEventGuests(id)

const {
  rawText: bulkText,
  invalidLines: bulkInvalidLines,
  guestCount: bulkGuestCount,
  parseText: bulkParseText,
  getGuestsForImport: bulkGetGuests,
  reset: bulkReset,
} = useEventBulkImport()

const event = ref<EventDetail | null>(null)
const loaded = ref(false)
const searchQuery = ref('')
const showAddForm = ref(false)
const showBulkImport = ref(false)
const deleteDialogOpen = ref(false)

// Add guest form
const newGuestName = ref('')
const newGuestDocument = ref('')
const newGuestPlate = ref('')

useHead({ title: computed(() => event.value?.title ?? 'Evento') })

const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  activo: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  completado: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  pendiente: 'Pendiente',
  activo: 'Activo',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

const GUEST_STATUS_COLORS: Record<GuestStatus, string> = {
  pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  dentro: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  salio: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
}

const GUEST_STATUS_LABELS: Record<GuestStatus, string> = {
  pendiente: 'Pendiente',
  dentro: 'Dentro',
  salio: 'Salió',
}

const { formatDateTime } = useFormatDate()

const filteredGuests = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return guests.value
  return guests.value.filter(g =>
    g.name.toLowerCase().includes(q)
    || (g.document && g.document.toLowerCase().includes(q))
    || (g.vehiclePlate && g.vehiclePlate.toLowerCase().includes(q)),
  )
})

async function loadData() {
  try {
    event.value = await fetchEvent(id)
    loaded.value = true
    await fetchGuests()
  }
  catch {
    // error set by composable
  }
}

onMounted(() => loadData())

async function handleApprove() {
  try {
    await approveEvent(id)
    // Re-fetch full event detail since approve returns partial data
    event.value = await fetchEvent(id)
    toast.success('Evento aprobado')
  }
  catch {
    toast.error(error.value ?? 'Error al aprobar evento')
  }
}

async function handleDelete() {
  try {
    await deleteEvent(id)
    toast.success('Evento eliminado')
    router.push('/admin/eventos')
  }
  catch {
    toast.error(error.value ?? 'Error al eliminar evento')
  }
}

async function handleAddGuest() {
  const name = newGuestName.value.trim()
  if (!name) return
  try {
    const guest: CreateGuest = {
      name,
      document: newGuestDocument.value.trim() || undefined,
      vehiclePlate: newGuestPlate.value.trim() || undefined,
    }
    const result = await addGuests([guest])
    toast.success(`${result.added} invitado agregado`)
    newGuestName.value = ''
    newGuestDocument.value = ''
    newGuestPlate.value = ''
    showAddForm.value = false
  }
  catch {
    toast.error(guestsError.value ?? 'Error al agregar invitado')
  }
}

async function handleBulkImport() {
  const guestsToImport = bulkGetGuests()
  if (guestsToImport.length === 0) return
  try {
    const result = await addGuests(guestsToImport)
    toast.success(`${result.added} invitados agregados${result.duplicates > 0 ? `, ${result.duplicates} duplicados` : ''}`)
    bulkReset()
    showBulkImport.value = false
  }
  catch {
    toast.error(guestsError.value ?? 'Error al importar invitados')
  }
}

async function handleRemoveGuest(guestId: string) {
  try {
    await removeGuest(guestId)
    toast.success('Invitado eliminado')
  }
  catch {
    toast.error(guestsError.value ?? 'Error al eliminar invitado')
  }
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading && !loaded" class="space-y-4">
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-24 w-full" />
    </div>

    <!-- Error -->
    <ErrorAlert v-else-if="error && !loaded" :message="error" />

    <!-- Content -->
    <div v-else-if="event" class="space-y-6">
      <!-- Header -->
      <Card>
        <CardContent class="p-5 md:p-8">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="space-y-1">
              <div class="flex items-center gap-3">
                <h1 class="text-xl font-bold">{{ event.title }}</h1>
                <span
                  class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                  :class="EVENT_STATUS_COLORS[event.status]"
                >
                  {{ EVENT_STATUS_LABELS[event.status] }}
                </span>
              </div>
              <p v-if="event.description" class="text-sm text-muted-foreground">{{ event.description }}</p>
            </div>
            <Button
              v-if="event.status === 'pendiente'"
              class="shrink-0"
              :disabled="isSubmitting"
              @click="handleApprove"
            >
              <CheckCircle class="mr-1.5 size-4" />
              Aprobar Evento
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Info -->
      <Card>
        <CardContent class="p-5 md:p-8">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="flex items-center gap-2 text-sm">
              <Home class="size-4 shrink-0 text-muted-foreground" />
              <span class="text-muted-foreground">Unidad:</span>
              <Badge variant="secondary" class="font-semibold">{{ event.unitLabel || event.unitNumber }}</Badge>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <User class="size-4 shrink-0 text-muted-foreground" />
              <span class="text-muted-foreground">Creado por:</span>
              <span class="font-medium">{{ event.createdByName }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <Calendar class="size-4 shrink-0 text-muted-foreground" />
              <span class="text-muted-foreground">Inicio:</span>
              <span class="font-medium">{{ formatDateTime(event.startsAt) }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <Clock class="size-4 shrink-0 text-muted-foreground" />
              <span class="text-muted-foreground">Fin:</span>
              <span class="font-medium">{{ formatDateTime(event.endsAt) }}</span>
            </div>
            <div v-if="event.guestLimit" class="flex items-center gap-2 text-sm">
              <Users class="size-4 shrink-0 text-muted-foreground" />
              <span class="text-muted-foreground">Límite:</span>
              <span class="font-medium">{{ event.guestLimit }} invitados</span>
            </div>
            <div v-if="event.notes" class="flex items-start gap-2 text-sm sm:col-span-2">
              <FileText class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span class="text-muted-foreground">Notas:</span>
              <span class="font-medium">{{ event.notes }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Guest management -->
      <Card>
        <CardContent class="p-5 md:p-8">
          <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-base font-semibold">Invitados ({{ guests.length }})</h2>
            <div class="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                @click="showBulkImport = !showBulkImport; showAddForm = false"
              >
                <Upload class="mr-1.5 size-3.5" />
                Importar en lote
              </Button>
              <Button
                size="sm"
                @click="showAddForm = !showAddForm; showBulkImport = false"
              >
                <Plus class="mr-1.5 size-3.5" />
                Agregar
              </Button>
            </div>
          </div>

          <!-- Add guest inline form -->
          <div v-if="showAddForm" class="mb-4 rounded-lg border bg-muted/30 p-4">
            <div class="grid gap-3 sm:grid-cols-3">
              <Input
                v-model="newGuestName"
                placeholder="Nombre *"
                class="h-10 text-base"
                @keydown.enter.prevent="handleAddGuest"
              />
              <Input
                v-model="newGuestDocument"
                placeholder="Cédula (opcional)"
                class="h-10 text-base"
                @keydown.enter.prevent="handleAddGuest"
              />
              <Input
                v-model="newGuestPlate"
                placeholder="Placa (opcional)"
                class="h-10 text-base"
                @keydown.enter.prevent="handleAddGuest"
              />
            </div>
            <div class="mt-3 flex justify-end gap-2">
              <Button variant="ghost" size="sm" @click="showAddForm = false">
                Cancelar
              </Button>
              <Button size="sm" :disabled="!newGuestName.trim() || guestsSubmitting" @click="handleAddGuest">
                Agregar
              </Button>
            </div>
          </div>

          <!-- Bulk import -->
          <div v-if="showBulkImport" class="mb-4 rounded-lg border bg-muted/30 p-4">
            <p class="mb-2 text-sm text-muted-foreground">Un invitado por línea. Formato: <code class="rounded bg-muted px-1 text-xs">Nombre, Cédula</code> o <code class="rounded bg-muted px-1 text-xs">Nombre - Cédula</code></p>
            <Textarea
              :model-value="bulkText"
              placeholder="Juan Perez, V-12345678&#10;Maria Lopez - V-87654321&#10;Pedro Garcia"
              rows="5"
              class="text-sm"
              @update:model-value="(v: string | number) => bulkParseText(String(v))"
            />
            <div v-if="bulkGuestCount > 0 || bulkInvalidLines.length > 0" class="mt-2 flex items-center gap-3 text-sm">
              <span class="text-primary font-medium">{{ bulkGuestCount }} válidos</span>
              <span v-if="bulkInvalidLines.length > 0" class="text-destructive">{{ bulkInvalidLines.length }} con errores</span>
            </div>
            <div class="mt-3 flex justify-end gap-2">
              <Button variant="ghost" size="sm" @click="showBulkImport = false; bulkReset()">
                Cancelar
              </Button>
              <Button size="sm" :disabled="bulkGuestCount === 0 || guestsSubmitting" @click="handleBulkImport">
                Importar {{ bulkGuestCount }}
              </Button>
            </div>
          </div>

          <!-- Search -->
          <div class="relative mb-4">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              placeholder="Buscar invitado..."
              class="h-10 pl-9 text-base"
            />
          </div>

          <!-- Error -->
          <ErrorAlert v-if="guestsError" :message="guestsError" class="mb-4" />

          <!-- Loading -->
          <ListSkeleton v-if="guestsLoading" :count="3" variant="row" />

          <!-- Empty -->
          <EmptyState
            v-else-if="guests.length === 0"
            :icon="Users"
            title="Sin invitados"
            description="Agrega invitados al evento"
          />

          <!-- Guest table (desktop) -->
          <div v-else>
            <div class="hidden overflow-x-auto rounded-lg border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead class="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="guest in filteredGuests" :key="guest.id">
                    <TableCell class="font-medium">{{ guest.name }}</TableCell>
                    <TableCell>{{ guest.document || '—' }}</TableCell>
                    <TableCell>
                      <span v-if="guest.vehiclePlate" class="font-mono text-xs font-semibold tracking-wider">{{ guest.vehiclePlate }}</span>
                      <span v-else class="text-muted-foreground">—</span>
                    </TableCell>
                    <TableCell>
                      <span
                        class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                        :class="GUEST_STATUS_COLORS[guest.status]"
                      >
                        {{ GUEST_STATUS_LABELS[guest.status] }}
                      </span>
                    </TableCell>
                    <TableCell class="text-right">
                      <Button
                        v-if="guest.status === 'pendiente'"
                        variant="ghost"
                        size="icon"
                        class="size-10 text-destructive hover:text-destructive"
                        title="Eliminar"
                        :disabled="guestsSubmitting"
                        @click="handleRemoveGuest(guest.id)"
                      >
                        <Trash2 class="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <!-- Guest cards (mobile) -->
            <div class="space-y-2 md:hidden">
              <Card v-for="guest in filteredGuests" :key="guest.id" class="px-3 py-2.5">
                <div class="flex items-center gap-2">
                  <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ guest.name }}</p>
                  <span
                    class="shrink-0 rounded-lg px-1.5 py-0.5 text-[11px] font-medium"
                    :class="GUEST_STATUS_COLORS[guest.status]"
                  >
                    {{ GUEST_STATUS_LABELS[guest.status] }}
                  </span>
                </div>
                <div class="mt-1 flex items-center gap-x-1 text-[11px] text-muted-foreground">
                  <template v-if="guest.document">
                    <IdCard class="size-3 shrink-0" />
                    <span>{{ guest.document }}</span>
                  </template>
                  <template v-if="guest.vehiclePlate">
                    <span v-if="guest.document" class="opacity-30">&middot;</span>
                    <Car class="size-3 shrink-0" />
                    <span class="font-mono text-[11px] font-semibold tracking-wider">{{ guest.vehiclePlate }}</span>
                  </template>
                  <span class="flex-1" />
                  <Button
                    v-if="guest.status === 'pendiente'"
                    variant="ghost"
                    class="h-6 px-2 text-[11px] text-destructive hover:text-destructive"
                    :disabled="guestsSubmitting"
                    @click="handleRemoveGuest(guest.id)"
                  >
                    <Trash2 class="mr-1 size-3" />
                    Quitar
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Delete event -->
      <div v-if="event.status === 'pendiente'" class="flex justify-end">
        <Button
          variant="outline"
          class="text-destructive hover:text-destructive"
          @click="deleteDialogOpen = true"
        >
          <Trash2 class="mr-1.5 size-4" />
          Eliminar evento
        </Button>
      </div>
    </div>

    <!-- Delete AlertDialog -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar evento</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion no se puede deshacer. El evento y todos sus invitados seran eliminados permanentemente.
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
  </div>
</template>
