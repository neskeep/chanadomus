<script setup lang="ts">
import { BellOff, BellRing, Loader2, Smartphone } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { PushPromptState } from '~/composables/usePushPrompt'

/**
 * Aviso descartable para activar notificaciones push en este dispositivo.
 * Toda la logica (estado, plataforma, posponer) vive en usePushPrompt.
 */
const { state, isIos, isLoading, settingsPath, enable, snooze } = usePushPrompt()

interface PromptContent {
  icon: Component
  iconClass: string
  title: string
  body: string
}

const CONTENT: Record<Exclude<PushPromptState, 'hidden'>, PromptContent> = {
  'enable': {
    icon: BellRing,
    iconClass: 'bg-accent text-primary',
    title: 'Activa las notificaciones en este dispositivo',
    body: 'Te avisamos cuando llega una visita a la alcabala, cuando hay un evento y cuando la administración publica un anuncio.',
  },
  'ios-install': {
    icon: Smartphone,
    iconClass: 'bg-accent text-primary',
    title: 'Instala ChanaDomus para recibir notificaciones',
    body: 'En iPhone y iPad solo llegan si abres la app desde la pantalla de inicio (iOS 16.4 o posterior).',
  },
  'denied': {
    icon: BellOff,
    iconClass: 'bg-destructive/10 text-destructive',
    title: 'Las notificaciones están bloqueadas',
    body: 'Tu navegador bloqueó las notificaciones de ChanaDomus. Para reactivarlas, toca el candado junto a la dirección del sitio y permite las notificaciones.',
  },
}

const IOS_DENIED_BODY = 'Para reactivarlas, abre Ajustes del iPhone, entra en Notificaciones, elige ChanaDomus y permite las notificaciones.'

const content = computed(() => {
  if (state.value === 'hidden') return null
  const base = CONTENT[state.value]
  if (state.value === 'denied' && isIos.value) return { ...base, body: IOS_DENIED_BODY }
  return base
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
    enter-from-class="-translate-y-1 opacity-0"
    leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
    leave-to-class="opacity-0"
  >
    <Card
      v-if="content"
      role="region"
      aria-labelledby="push-prompt-title"
      class="gap-3 p-4 md:p-5"
    >
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div class="flex min-w-0 flex-1 items-start gap-3 md:items-center md:gap-4">
          <div :class="['flex size-10 shrink-0 items-center justify-center rounded-lg', content.iconClass]">
            <component :is="content.icon" class="size-5" aria-hidden="true" />
          </div>
          <div class="min-w-0 flex-1 space-y-1">
            <h2 id="push-prompt-title" class="text-base font-semibold leading-tight">
              {{ content.title }}
            </h2>
            <p class="max-w-prose text-sm text-muted-foreground">
              {{ content.body }}
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <Button
            v-if="state === 'enable'"
            class="h-11 flex-1 md:h-9 md:flex-none"
            :disabled="isLoading"
            @click="enable"
          >
            <Loader2 v-if="isLoading" class="size-4 animate-spin" aria-hidden="true" />
            Activar
          </Button>
          <Button
            v-else-if="state === 'denied'"
            variant="outline"
            class="h-11 flex-1 md:h-9 md:flex-none"
            as-child
          >
            <NuxtLink :to="settingsPath">Ver ajustes de notificaciones</NuxtLink>
          </Button>
          <Button
            variant="ghost"
            class="h-11 text-muted-foreground md:h-9"
            @click="snooze"
          >
            Ahora no
          </Button>
        </div>
      </div>

      <PushIosInstallSteps v-if="state === 'ios-install'" />
    </Card>
  </Transition>
</template>
