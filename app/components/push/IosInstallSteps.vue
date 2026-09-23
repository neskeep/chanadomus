<script setup lang="ts">
import { Share, SquarePlus, Smartphone } from 'lucide-vue-next'

/**
 * Pasos para instalar ChanaDomus en la pantalla de inicio de iPhone/iPad.
 * Se reutiliza en el aviso global (PushPrompt) y en Mi Chana > Notificaciones.
 */
const steps = [
  { icon: Share, text: 'En Safari, toca el botón Compartir.' },
  { icon: SquarePlus, text: 'Elige «Añadir a pantalla de inicio».' },
  { icon: Smartphone, text: 'Abre ChanaDomus desde el ícono nuevo y activa las notificaciones.' },
]
</script>

<template>
  <ol class="grid gap-2 md:grid-cols-3">
    <li
      v-for="(step, index) in steps"
      :key="index"
      class="flex items-start gap-2.5 rounded-lg bg-muted/60 px-3 py-2.5"
    >
      <span class="flex size-6 shrink-0 items-center justify-center rounded-lg bg-background text-xs font-semibold tabular-nums text-primary ring-1 ring-border">
        {{ index + 1 }}
      </span>
      <span class="flex min-w-0 flex-1 items-start gap-2 text-sm leading-snug">
        <span>{{ step.text }}</span>
        <component :is="step.icon" class="ml-auto mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </span>
    </li>
  </ol>
</template>
