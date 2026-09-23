<script setup lang="ts">
/** Confirmación para cancelar un pase de visita. */
interface Props {
  visitorName: string
  isCanceling?: boolean
}

withDefaults(defineProps<Props>(), { isCanceling: false })

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  confirm: []
}>()
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent @click.stop>
      <AlertDialogHeader>
        <AlertDialogTitle>¿Cancelar este pase?</AlertDialogTitle>
        <AlertDialogDescription class="text-base">
          El pase de <span class="font-medium text-foreground">{{ visitorName }}</span> dejará de servir y ya no se podrá usar para entrar. Esta acción no se puede deshacer.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel class="h-11 md:h-9" :disabled="isCanceling">No, mantener el pase</AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          class="h-11 md:h-9"
          :disabled="isCanceling"
          @click="emit('confirm')"
        >
          {{ isCanceling ? 'Cancelando...' : 'Sí, cancelar pase' }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
