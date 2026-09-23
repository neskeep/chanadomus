<script setup lang="ts">
/**
 * Botón "Registrar salida de todos (N)" con confirmación.
 * Solo se muestra si queda algún invitado dentro. La lógica vive en useEventCheckoutAll.
 */
import { LogOut, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { BulkCheckoutResult } from '~~/shared/types/event'

interface Props {
  eventId: string
  insideCount: number
  size?: 'default' | 'sm'
}

const props = withDefaults(defineProps<Props>(), { size: 'default' })

const emit = defineEmits<{
  done: [result: BulkCheckoutResult]
}>()

const open = ref(false)
const { isCheckingOutAll, checkoutAll } = useEventCheckoutAll(() => props.eventId)

const guestsLabel = computed(() => props.insideCount === 1 ? '1 invitado que sigue dentro' : `${props.insideCount} invitados que siguen dentro`)

async function handleConfirm() {
  try {
    const result = await checkoutAll()
    if (!result) return
    if (result.closed === 0) toast.info('Ya no quedaba ningún invitado dentro')
    else toast.success(result.closed === 1 ? 'Salida registrada para 1 invitado' : `Salida registrada para ${result.closed} invitados`)
    emit('done', result)
  }
  catch (err: unknown) {
    toast.error(getApiErrorMessage(err, 'No se pudo registrar la salida de todos'))
  }
}
</script>

<template>
  <template v-if="insideCount > 0">
    <Button
      variant="outline"
      :size="size"
      :disabled="isCheckingOutAll"
      @click="open = true"
    >
      <Loader2 v-if="isCheckingOutAll" class="mr-1.5 size-4 animate-spin" />
      <LogOut v-else class="mr-1.5 size-4" />
      Registrar salida de todos ({{ insideCount }})
    </Button>

    <AlertDialog v-model:open="open">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Registrar la salida de todos?</AlertDialogTitle>
          <AlertDialogDescription class="text-base">
            Se marcará la salida de {{ guestsLabel }}, con la hora actual y a tu nombre. Úsalo cuando el evento ya cerró y los invitados se fueron.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel class="h-11 md:h-9" :disabled="isCheckingOutAll">Cancelar</AlertDialogCancel>
          <AlertDialogAction class="h-11 md:h-9" :disabled="isCheckingOutAll" @click="handleConfirm">
            Sí, registrar salidas
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </template>
</template>
