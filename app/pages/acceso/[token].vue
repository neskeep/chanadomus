<script setup lang="ts">
import { CheckCircle, Clock, Info, XCircle, Loader2 } from 'lucide-vue-next'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'
import { ACCESS_STATUS_COLORS } from '~/composables/useColorMap'

definePageMeta({ layout: false })

interface ValidationResult {
  status: 'valid' | 'expired' | 'already_used' | 'invalid'
  visitorName?: string
  visitorDocument?: string | null
  visitorType?: 'invitado' | 'proveedor'
  unitNumber?: string
  unitLabel?: string | null
  expiresAt?: string
  usedAt?: string | null
}

const route = useRoute()
const token = route.params.token as string

const loading = ref(true)
const result = ref<ValidationResult | null>(null)
const errorOccurred = ref(false)

const { formatDateTime } = useFormatDate()

const visitorTypeLabel = computed(() => {
  if (!result.value?.visitorType) return ''
  return result.value.visitorType === 'invitado' ? 'Invitado' : 'Proveedor'
})

const statusConfig = computed(() => {
  const status = result.value?.status
  switch (status) {
    case 'valid':
      return {
        icon: CheckCircle,
        ...ACCESS_STATUS_COLORS.valid,
        title: 'ACCESO AUTORIZADO',
      }
    case 'expired':
      return {
        icon: Clock,
        ...ACCESS_STATUS_COLORS.expired,
        title: 'ACCESO EXPIRADO',
      }
    case 'already_used':
      return {
        icon: Info,
        ...ACCESS_STATUS_COLORS.already_used,
        title: 'CODIGO YA UTILIZADO',
      }
    case 'invalid':
    default:
      return {
        icon: XCircle,
        ...ACCESS_STATUS_COLORS.invalid,
        title: 'CODIGO INVALIDO',
      }
  }
})

onMounted(async () => {
  try {
    const response = await $fetch<{ data: ValidationResult }>('/api/qr/lookup', {
      method: 'POST',
      body: { token },
    })
    result.value = response.data
  }
  catch {
    errorOccurred.value = true
    result.value = { status: 'invalid' }
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-background p-4">
    <!-- Header -->
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-bold tracking-tight text-foreground">
        ChanaDomus
      </h1>
      <p class="text-sm text-muted-foreground">
        Control de acceso
      </p>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="flex flex-col items-center gap-3"
    >
      <Loader2 class="size-10 animate-spin text-muted-foreground" />
      <p class="text-sm text-muted-foreground">
        Verificando acceso...
      </p>
    </div>

    <!-- Result -->
    <Card
      v-else-if="result"
      class="w-full max-w-md border-2"
      :class="statusConfig.borderColor"
    >
      <CardHeader class="items-center text-center">
        <component
          :is="statusConfig.icon"
          class="size-16"
          :class="statusConfig.iconColor"
          :stroke-width="1.5"
        />
        <CardTitle class="text-xl">
          {{ statusConfig.title }}
        </CardTitle>
      </CardHeader>

      <CardContent class="space-y-4">
        <!-- Valid -->
        <template v-if="result.status === 'valid'">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Visitante</span>
              <span class="font-medium">{{ result.visitorName }}</span>
            </div>

            <Separator />

            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Tipo</span>
              <Badge variant="secondary">
                {{ visitorTypeLabel }}
              </Badge>
            </div>

            <Separator />

            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Unidad destino</span>
              <span class="font-medium">
                {{ result.unitNumber }}
                <span v-if="result.unitLabel" class="text-muted-foreground">
                  ({{ result.unitLabel }})
                </span>
              </span>
            </div>

            <Separator />

            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Valido hasta</span>
              <span class="font-medium">{{ result.expiresAt ? formatDateTime(result.expiresAt) : '-' }}</span>
            </div>
          </div>
        </template>

        <!-- Expired -->
        <template v-else-if="result.status === 'expired'">
          <div class="space-y-3 text-center">
            <p v-if="result.visitorName" class="font-medium">
              {{ result.visitorName }}
            </p>
            <p class="text-sm text-muted-foreground">
              Este codigo expiro. Solicite uno nuevo al propietario.
            </p>
          </div>
        </template>

        <!-- Already used -->
        <template v-else-if="result.status === 'already_used'">
          <div class="space-y-3 text-center">
            <p v-if="result.visitorName" class="font-medium">
              {{ result.visitorName }}
            </p>
            <p class="text-sm text-muted-foreground">
              Usado el: {{ result.usedAt ? formatDateTime(result.usedAt) : '-' }}
            </p>
          </div>
        </template>

        <!-- Invalid -->
        <template v-else>
          <p class="text-center text-sm text-muted-foreground">
            Este codigo no existe o no es valido.
          </p>
        </template>
      </CardContent>

      <!-- Footer for valid status -->
      <CardFooter
        v-if="result.status === 'valid'"
        class="justify-center border-t pt-4"
      >
        <p class="text-center text-sm text-muted-foreground">
          Presente esta pantalla al vigilante en la alcabala
        </p>
      </CardFooter>
    </Card>

    <!-- Page footer -->
    <p class="mt-8 text-xs text-muted-foreground">
      Ranchos de Chana
    </p>
  </div>
</template>
