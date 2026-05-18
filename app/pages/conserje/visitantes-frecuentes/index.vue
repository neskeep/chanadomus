<script setup lang="ts">
import { Plus, Users, QrCode, Pencil, Trash2, Car } from 'lucide-vue-next'
import type { FrequentVisitor, UpdateFrequentVisitor } from '~~/shared/types/frequent-visitor'
import type { VisitorType } from '~~/shared/types/qr'

useHead({ title: 'Visitantes Frecuentes' })

const { target, isMounted } = useTopbarPortal()
const { visitors, isLoading, isSubmitting, error, fetchVisitors, updateVisitor, removeVisitor } = useFrequentVisitors()
const { formatRelativeTime } = useFormatDate()

onMounted(() => {
  fetchVisitors()
})

// --- Edit Dialog ---
const showEditDialog = ref(false)
const editingVisitor = ref<FrequentVisitor | null>(null)
const editForm = ref({
  visitorName: '',
  visitorDocument: '',
  visitorType: 'invitado' as VisitorType,
  vehiclePlate: '',
})

function openEdit(visitor: FrequentVisitor) {
  editingVisitor.value = visitor
  editForm.value = {
    visitorName: visitor.visitorName,
    visitorDocument: visitor.visitorDocument ?? '',
    visitorType: visitor.visitorType,
    vehiclePlate: visitor.vehiclePlate ?? '',
  }
  showEditDialog.value = true
}

async function handleEdit() {
  if (!editingVisitor.value || !editForm.value.visitorName.trim()) return
  const data: UpdateFrequentVisitor = {
    visitorName: editForm.value.visitorName.trim(),
    visitorDocument: editForm.value.visitorDocument.trim() || null,
    visitorType: editForm.value.visitorType,
    vehiclePlate: editForm.value.vehiclePlate.trim() || null,
  }
  try {
    await updateVisitor(editingVisitor.value.id, data)
    showEditDialog.value = false
    editingVisitor.value = null
  }
  catch {
    // Error handled by composable
  }
}

// --- Delete Dialog ---
const showDeleteDialog = ref(false)
const deletingVisitor = ref<FrequentVisitor | null>(null)

function openDelete(visitor: FrequentVisitor) {
  deletingVisitor.value = visitor
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!deletingVisitor.value) return
  try {
    await removeVisitor(deletingVisitor.value.id)
    showDeleteDialog.value = false
    deletingVisitor.value = null
  }
  catch {
    // Error handled by composable
  }
}

function createQr(visitor: FrequentVisitor) {
  navigateTo({
    path: '/conserje/nueva-visita',
    query: {
      fid: visitor.id,
      nombre: visitor.visitorName,
      cedula: visitor.visitorDocument || undefined,
      tipo: visitor.visitorType,
    },
  })
}
</script>

<template>
  <div>
    <!-- Topbar actions (desktop) -->
    <Teleport :to="target" defer v-if="isMounted">
      <Button size="sm" @click="navigateTo('/conserje/visitantes-frecuentes/nuevo')">
        <Plus class="mr-1.5 size-3.5" />
        Agregar
      </Button>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" @click="navigateTo('/conserje/visitantes-frecuentes/nuevo')">
        <Plus class="size-4" />
      </Button>
    </TopbarMobileAction>

    <!-- Error alert -->
    <ErrorAlert :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="4" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="visitors.length === 0"
      :icon="Users"
      title="Sin visitantes frecuentes"
      description="Agrega personas que visitan regularmente este rancho para crear pases mas rapido"
    >
      <template #action>
        <Button @click="navigateTo('/conserje/visitantes-frecuentes/nuevo')">
          <Plus class="mr-1.5 size-4" />
          Agregar visitante
        </Button>
      </template>
    </EmptyState>

    <!-- Visitors list -->
    <div v-else class="space-y-2">
      <Card v-for="visitor in visitors" :key="visitor.id">
        <CardContent class="px-3 py-2.5">
          <div class="flex items-center gap-2">
            <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ visitor.visitorName }}</p>
            <Badge variant="secondary" class="shrink-0 text-[11px]">
              {{ visitor.visitorType === 'invitado' ? 'Invitado' : 'Proveedor' }}
            </Badge>
          </div>

          <div class="mt-1 flex items-center gap-x-1 text-[11px] text-muted-foreground">
            <span class="tabular-nums">{{ visitor.visitCount }} visita{{ visitor.visitCount !== 1 ? 's' : '' }}</span>
            <template v-if="visitor.lastVisitAt">
              <span class="opacity-30">&middot;</span>
              <span class="truncate">{{ formatRelativeTime(visitor.lastVisitAt) }}</span>
            </template>
            <template v-if="visitor.vehiclePlate">
              <span class="opacity-30">&middot;</span>
              <Car class="inline size-3" />
              <span>{{ visitor.vehiclePlate }}</span>
            </template>

            <span class="flex-1" />

            <Button variant="ghost" size="sm" class="h-6 px-2 text-[11px]" @click="createQr(visitor)">
              <QrCode class="mr-1 size-3" />
              QR
            </Button>
            <Button variant="ghost" size="sm" class="h-6 px-2 text-[11px]" @click="openEdit(visitor)">
              <Pencil class="size-3" />
            </Button>
            <Button variant="ghost" size="sm" class="h-6 px-2 text-[11px] text-destructive hover:text-destructive" @click="openDelete(visitor)">
              <Trash2 class="size-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Edit Dialog -->
    <Dialog v-model:open="showEditDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar visitante</DialogTitle>
          <DialogDescription>
            Actualiza los datos de {{ editingVisitor?.visitorName }}
          </DialogDescription>
        </DialogHeader>

        <form class="space-y-4" @submit.prevent="handleEdit">
          <div class="space-y-1.5">
            <Label for="edit-name">Nombre <span class="text-destructive">*</span></Label>
            <Input id="edit-name" v-model="editForm.visitorName" placeholder="Nombre completo" required />
          </div>
          <div class="space-y-1.5">
            <Label for="edit-document">Cedula <span class="text-xs text-muted-foreground">(opcional)</span></Label>
            <Input id="edit-document" v-model="editForm.visitorDocument" placeholder="V-12345678" />
          </div>
          <div class="space-y-1.5">
            <Label for="edit-type">Tipo</Label>
            <Select v-model="editForm.visitorType">
              <SelectTrigger id="edit-type" class="w-full">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invitado">Invitado</SelectItem>
                <SelectItem value="proveedor">Proveedor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <Label for="edit-plate">Placa del vehiculo <span class="text-xs text-muted-foreground">(opcional)</span></Label>
            <Input id="edit-plate" v-model="editForm.vehiclePlate" placeholder="ABC123" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showEditDialog = false">Cancelar</Button>
            <Button type="submit" :disabled="!editForm.visitorName.trim() || isSubmitting">
              {{ isSubmitting ? 'Guardando...' : 'Guardar cambios' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Delete confirmation -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar visitante</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminara a <span class="font-medium">{{ deletingVisitor?.visitorName }}</span> del directorio de visitantes frecuentes. Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="showDeleteDialog = false">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isSubmitting"
            @click="handleDelete"
          >
            {{ isSubmitting ? 'Eliminando...' : 'Eliminar' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
