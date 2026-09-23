<script setup lang="ts">
import { ArrowLeft, Ban, Info, Plus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { QrPassItem } from '~~/shared/types/qr'
import { qrEditBlockReason } from '~~/shared/lib/qr-pass'
import type { VisitPassFormInitial, VisitPassFormValues } from '~/composables/useVisitPassForm'

/**
 * Edición de un pase de visita (propietario y conserje). Si el pase ya no se
 * puede editar, explica por qué y ofrece cancelarlo o volver.
 */
interface Props {
  passId: string
  /** Ruta de "Mis Visitas" del rol, a la que se vuelve al terminar */
  listPath: string
  /** Ruta para crear un pase nuevo cuando este ya no sirve */
  newPassPath: string
}

const props = defineProps<Props>()

const { fetchQrPass, updateQr, cancelQr, isSaving, isCanceling, error } = useQr()

const pass = ref<QrPassItem | null>(null)
const isLoadingPass = ref(true)
const loadError = ref<string | null>(null)
/** Mensaje del servidor cuando rechazó la edición (409) */
const blockMessage = ref<string | null>(null)
const showCancelDialog = ref(false)

async function loadPass() {
  try {
    pass.value = await fetchQrPass(props.passId)
  }
  catch {
    loadError.value = error.value ?? 'No se pudo cargar el pase'
  }
}

onMounted(async () => {
  await loadPass()
  isLoadingPass.value = false
})

const formInitial = computed<VisitPassFormInitial>(() => ({
  visitorName: pass.value?.visitorName ?? '',
  visitorDocument: pass.value?.visitorDocument ?? '',
  visitorType: pass.value?.visitorType,
  expiresAt: pass.value?.expiresAt,
  multiUse: pass.value?.multiUse ?? false,
}))

const isEditable = computed(() => !!pass.value?.canEdit && !blockMessage.value)

/** Motivo para mostrar si no se puede editar: el del servidor o la regla compartida. */
const notEditableReason = computed(() => {
  if (blockMessage.value) return blockMessage.value
  const p = pass.value
  if (!p) return null
  return qrEditBlockReason({
    expiresAt: new Date(p.expiresAt),
    usedAt: p.usedAt ? new Date(p.usedAt) : null,
    canceledAt: p.canceledAt ? new Date(p.canceledAt) : null,
    hasAccess: p.hasAccess,
  }) ?? 'Este pase ya no se puede editar'
})

async function handleSubmit(values: VisitPassFormValues) {
  const input = toQrUpdateInput(values, formInitial.value)
  if (!input) return
  try {
    await updateQr(props.passId, input)
    toast.success('Cambios guardados')
    await navigateTo(props.listPath)
  }
  catch (err: unknown) {
    if (getApiErrorStatus(err) === 409) {
      blockMessage.value = error.value ?? 'Este pase ya no se puede editar'
      // Refresca estado y permisos (p. ej. si se acaba de usar)
      await loadPass()
      error.value = null
      return
    }
    toast.error(error.value ?? 'No se pudieron guardar los cambios')
  }
}

async function handleCancel() {
  try {
    await cancelQr(props.passId)
    showCancelDialog.value = false
    toast.success('Pase cancelado')
    await navigateTo(props.listPath)
  }
  catch {
    toast.error(error.value ?? 'No se pudo cancelar el pase')
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <ListSkeleton v-if="isLoadingPass" :count="2" />

    <!-- No se pudo cargar -->
    <div v-else-if="!pass" class="space-y-4">
      <ErrorAlert :message="loadError ?? 'No encontramos este pase. Vuelve a Mis Visitas y elígelo de la lista.'" />
      <Button as-child variant="outline" class="h-12 w-full text-base sm:w-auto">
        <NuxtLink :to="listPath">
          <ArrowLeft class="size-4" />
          Volver a Mis Visitas
        </NuxtLink>
      </Button>
    </div>

    <!-- Ya no se puede editar -->
    <Card v-else-if="!isEditable">
      <CardContent class="space-y-4 p-4">
        <div>
          <p class="text-base font-semibold">{{ pass.visitorName }}</p>
          <p v-if="pass.visitorDocument" class="text-sm text-muted-foreground">Cédula {{ pass.visitorDocument }}</p>
        </div>
        <ErrorAlert :message="notEditableReason" />
        <p v-if="!pass.canCancel && pass.status !== 'canceled'" class="text-sm text-muted-foreground">
          Si esta persona necesita volver a entrar, crea un pase nuevo.
        </p>
        <div class="flex flex-col gap-3 sm:flex-row">
          <Button
            v-if="pass.canCancel"
            variant="destructive"
            class="h-12 text-base sm:h-10"
            :disabled="isCanceling"
            @click="showCancelDialog = true"
          >
            <Ban class="size-4" />
            Cancelar pase
          </Button>
          <Button v-if="!pass.canCancel" as-child class="h-12 text-base sm:h-10">
            <NuxtLink :to="newPassPath">
              <Plus class="size-4" />
              Crear pase nuevo
            </NuxtLink>
          </Button>
          <Button as-child variant="outline" class="h-12 text-base sm:h-10">
            <NuxtLink :to="listPath">
              <ArrowLeft class="size-4" />
              Volver a Mis Visitas
            </NuxtLink>
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Formulario de edición -->
    <div v-else class="space-y-4">
      <p class="flex items-start gap-2 rounded-lg bg-accent px-3 py-2.5 text-base text-foreground">
        <Info class="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
        El QR que ya compartiste sigue sirviendo con estos cambios: no hace falta reenviarlo.
      </p>

      <VisitPassForm
        mode="edit"
        :initial="formInitial"
        :is-submitting="isSaving"
        @submit="handleSubmit"
      >
        <template #actions>
          <Button as-child variant="outline" class="h-12 w-full text-base">
            <NuxtLink :to="listPath">Volver sin guardar</NuxtLink>
          </Button>
        </template>
      </VisitPassForm>

      <div v-if="pass.canCancel" class="flex flex-col items-center gap-1 pt-2 text-center">
        <p class="text-sm text-muted-foreground">¿Ya no viene esta visita?</p>
        <Button
          variant="ghost"
          class="h-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
          :disabled="isCanceling"
          @click="showCancelDialog = true"
        >
          <Ban class="size-4" />
          Cancelar pase
        </Button>
      </div>
    </div>

    <VisitCancelDialog
      v-if="pass"
      v-model:open="showCancelDialog"
      :visitor-name="pass.visitorName"
      :is-canceling="isCanceling"
      @confirm="handleCancel"
    />
  </div>
</template>
