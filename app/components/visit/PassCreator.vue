<script setup lang="ts">
import { Plus, Share2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { VisitorType } from '~~/shared/types/qr'
import type { VisitPassFormInitial, VisitPassFormValues } from '~/composables/useVisitPassForm'

/**
 * Flujo completo de "Nueva visita" (formulario + QR generado), igual para
 * propietario y conserje. La página solo resuelve de qué unidad es el pase.
 */
interface Props {
  unitId: string | null
}

const props = defineProps<Props>()

const route = useRoute()
const { generateQr, isGenerating, error } = useQr()
const { visitors: frequentVisitors, fetchVisitors: fetchFrequentVisitors, addVisitor: addFrequentVisitor } = useFrequentVisitors()
const { sharePass, qrImage } = useShareVisitPass()
const { formatDateTime } = useFormatDate()

// Precarga desde "visitantes frecuentes" (?nombre=&cedula=&tipo=&fid=)
function initialFromQuery(): VisitPassFormInitial {
  const nombre = route.query.nombre
  if (typeof nombre !== 'string' || !nombre) return {}
  const tipo = route.query.tipo
  return {
    visitorName: nombre,
    visitorDocument: typeof route.query.cedula === 'string' ? route.query.cedula : '',
    visitorType: tipo === 'invitado' || tipo === 'proveedor' ? tipo : undefined,
    frequentVisitorId: typeof route.query.fid === 'string' && route.query.fid ? route.query.fid : null,
  }
}

const formInitial = ref<VisitPassFormInitial>({})
const formKey = ref(0)

const generated = ref<{ token: string; visitorName: string; visitorType: VisitorType; expiresAt: string } | null>(null)
const qrDataUrl = ref<string | null>(null)
const shareMessage = ref<string | null>(null)

onMounted(() => {
  formInitial.value = initialFromQuery()
  formKey.value++
  fetchFrequentVisitors()
})

async function handleSubmit(values: VisitPassFormValues) {
  if (!values.expiresAt) return
  if (!props.unitId) {
    error.value = 'Tu usuario no tiene una vivienda asignada. Pide a la administración que la asigne.'
    return
  }
  shareMessage.value = null

  try {
    const result = await generateQr({
      visitorName: values.visitorName,
      visitorDocument: values.visitorDocument || undefined,
      visitorType: values.visitorType,
      unitId: props.unitId,
      expiresAt: values.expiresAt,
      multiUse: values.multiUse || undefined,
      frequentVisitorId: values.frequentVisitorId || undefined,
    })

    generated.value = {
      token: result.token,
      visitorName: result.visitorName,
      visitorType: result.visitorType,
      expiresAt: result.expiresAt,
    }
    qrDataUrl.value = await qrImage(result.token, 256)

    if (values.saveAsFrequent && !values.frequentVisitorId) {
      try {
        await addFrequentVisitor({
          visitorName: values.visitorName,
          visitorDocument: values.visitorDocument || undefined,
          visitorType: values.visitorType,
          unitId: props.unitId,
        })
        toast.success('Visitante guardado como frecuente')
      }
      catch (err) {
        console.warn('[nueva-visita] Error al guardar visitante frecuente:', err)
        toast.error('No se pudo guardar como visitante frecuente')
      }
    }
  }
  catch {
    // El mensaje queda en `error` (useQr)
  }
}

let shareMessageTimer: ReturnType<typeof setTimeout> | undefined

async function handleShare() {
  if (!generated.value) return
  const result = await sharePass(generated.value.token)
  if (result === 'copied') shareMessage.value = 'Enlace copiado. Pégalo en el chat con tu visitante.'
  else if (result === 'failed') shareMessage.value = 'No se pudo copiar el enlace'
  else return
  clearTimeout(shareMessageTimer)
  shareMessageTimer = setTimeout(() => { shareMessage.value = null }, 3000)
}

onBeforeUnmount(() => clearTimeout(shareMessageTimer))

function handleReset() {
  generated.value = null
  qrDataUrl.value = null
  shareMessage.value = null
  error.value = null
  formInitial.value = {}
  formKey.value++
}
</script>

<template>
  <div>
    <ErrorAlert :message="error" class="mb-4" />

    <VisitPassForm
      v-if="!generated"
      :key="formKey"
      mode="create"
      :initial="formInitial"
      :frequent-visitors="frequentVisitors"
      :is-submitting="isGenerating"
      @submit="handleSubmit"
    />

    <div v-else class="space-y-4">
      <Card>
        <CardContent class="flex flex-col items-center space-y-4 p-4">
          <img
            v-if="qrDataUrl"
            :src="qrDataUrl"
            :alt="`Código QR del pase de ${generated.visitorName}`"
            class="size-64 rounded-lg"
          >

          <Separator />

          <dl class="w-full space-y-2 text-base">
            <div class="flex justify-between gap-4">
              <dt class="text-muted-foreground">Visitante</dt>
              <dd class="text-right font-medium">{{ generated.visitorName }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted-foreground">Tipo</dt>
              <dd>
                <Badge variant="secondary">
                  {{ generated.visitorType === 'invitado' ? 'Invitado' : 'Proveedor' }}
                </Badge>
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted-foreground">Válido hasta</dt>
              <dd class="text-right text-sm tabular-nums">{{ formatDateTime(generated.expiresAt) }}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div
        v-if="shareMessage"
        role="status"
        class="rounded-lg border border-primary/50 bg-primary/10 p-3 text-center text-sm text-primary"
      >
        {{ shareMessage }}
      </div>

      <div class="space-y-3">
        <Button class="h-12 w-full text-base" @click="handleShare">
          <Share2 class="size-4" />
          Compartir con el visitante
        </Button>
        <Button variant="outline" class="h-12 w-full text-base" @click="handleReset">
          <Plus class="size-4" />
          Crear otro pase
        </Button>
      </div>
    </div>
  </div>
</template>
