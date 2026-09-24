<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

/**
 * Confirmación para cerrar o regenerar un mes (solo superadmin).
 * Con varios `periods` muestra un selector de mes; con uno, confirma ese.
 * No se cierra sola al confirmar: el padre la cierra cuando termina la petición.
 */
interface Props {
  /** Periodos YYYY-MM que se pueden elegir, del más reciente al más antiguo */
  periods: readonly string[]
  /** Periodos que ya tienen cierre (para avisar de que se reemplaza) */
  closedPeriods?: readonly string[]
  /** Mes en curso (YYYY-MM): si se elige, avisa de que los cambios posteriores no entran */
  currentPeriod?: string
  isClosing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  closedPeriods: () => [],
  currentPeriod: undefined,
  isClosing: false,
})

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  confirm: [period: string]
}>()

const { formatMonthYear } = useFormatDate()

const selected = ref(props.periods[0] ?? '')

// Al abrir, vuelve al primer periodo disponible.
watch(open, (isOpen) => {
  if (isOpen) selected.value = props.periods[0] ?? ''
})

const monthName = (period: string) => formatMonthYear(`${period}-01`)
const isReplacing = computed(() => props.closedPeriods.includes(selected.value))
const selectId = useId()

const title = computed(() => {
  const month = monthName(selected.value).toLowerCase()
  return isReplacing.value ? `¿Regenerar el cierre de ${month}?` : `¿Cerrar ${month}?`
})

const confirmLabel = computed(() => {
  if (props.isClosing) return 'Guardando...'
  return isReplacing.value ? 'Regenerar cierre' : 'Cerrar mes'
})
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ title }}
        </AlertDialogTitle>
        <AlertDialogDescription class="space-y-2 text-base">
          <span v-if="isReplacing" class="block">
            Ya hay un cierre guardado de este mes. Al regenerarlo, esa foto se reemplaza por el cálculo de ahora mismo, con las unidades, usuarios y pases que existan hoy.
          </span>
          <span v-else class="block">
            Se guardará la tarifa de cada unidad con los datos de ahora mismo. Esa foto no cambia aunque después cambien las unidades o los pases.
          </span>
          <span v-if="selected === currentPeriod" class="block font-medium text-foreground">
            Este mes todavía no ha terminado. Lo que cambie hasta el último día no entrará en el cierre, salvo que lo regeneres.
          </span>
          <span class="block">Quedará registrado que lo hiciste tú.</span>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div v-if="periods.length > 1" class="space-y-1.5">
        <Label :for="selectId">Mes</Label>
        <Select v-model="selected">
          <SelectTrigger :id="selectId" class="h-11 w-full md:h-9">
            <SelectValue placeholder="Elige un mes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="period in periods" :key="period" :value="period">
              {{ monthName(period) }}{{ closedPeriods.includes(period) ? ' (ya cerrado)' : '' }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel class="h-11 md:h-9" :disabled="isClosing">Cancelar</AlertDialogCancel>
        <Button class="h-11 md:h-9" :disabled="isClosing || !selected" @click="emit('confirm', selected)">
          <Loader2 v-if="isClosing" class="size-4 animate-spin" aria-hidden="true" />
          {{ confirmLabel }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
