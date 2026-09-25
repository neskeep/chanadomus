<script setup lang="ts">
import { Info } from 'lucide-vue-next'

/** Explica al administrador cómo se decide la tarifa de cada unidad. */
</script>

<template>
  <div class="flex items-start gap-2.5 rounded-lg bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground">
    <Info class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
    <div class="space-y-1">
      <p>
        <span class="font-medium text-foreground">Tarifa completa:</span>
        unidades con al menos un usuario, o una persona o un vehículo con QR permanente (miembro del hogar, personal o vehículo de residente).
      </p>
      <p>
        <span class="font-medium text-foreground">Tarifa reducida:</span>
        unidades sin ningún usuario y sin personas ni vehículos con QR permanente (miembro del hogar, personal o vehículo de residente). Las unidades inactivas siguen la misma regla.
      </p>
      <p>
        El cálculo es automático: cuando una unidad recibe su primer usuario o pase, pasa a tarifa completa.
      </p>
    </div>
  </div>
</template>
