<script setup lang="ts">
import { Bell, BellOff, Loader2 } from 'lucide-vue-next'
import { PUSH_CATEGORIES } from '~~/shared/types/push-preferences'
import type { PushCategory } from '~~/shared/types/push-preferences'

useHead({ title: 'Notificaciones' })

const { preferences, isLoading, isSaving, error, fetchPreferences, toggleCategory } = usePushPreferences()
const { isSupported, permission, isSubscribed, subscribe, unsubscribe, checkSubscription } = usePushNotifications()

const isSubscribing = ref(false)
const isUnsubscribing = ref(false)

async function handleSubscribe() {
  isSubscribing.value = true
  await subscribe()
  isSubscribing.value = false
}

async function handleUnsubscribe() {
  isUnsubscribing.value = true
  await unsubscribe()
  isUnsubscribing.value = false
}

onMounted(async () => {
  await Promise.all([
    fetchPreferences(),
    checkSubscription(),
  ])
})

function handleToggle(category: PushCategory, enabled: boolean) {
  toggleCategory(category, enabled)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Push Subscription Status -->
    <Card class="p-4">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div
:class="[
            'flex size-8 items-center justify-center rounded-md',
            isSubscribed ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
          ]">
            <Bell v-if="isSubscribed" class="size-4" />
            <BellOff v-else class="size-4" />
          </div>
          <div>
            <p class="text-sm font-medium">
              {{ isSubscribed ? 'Notificaciones activas' : 'Notificaciones desactivadas' }}
            </p>
            <p class="text-xs text-muted-foreground">
              <template v-if="!isSupported">Tu navegador no soporta notificaciones push</template>
              <template v-else-if="permission === 'denied'">Permiso denegado — revisa la configuración de tu navegador</template>
              <template v-else-if="isSubscribed">Recibirás notificaciones según tus preferencias</template>
              <template v-else>Activa las notificaciones para recibir alertas</template>
            </p>
          </div>
        </div>
        <Button
          v-if="isSupported && !isSubscribed && permission !== 'denied'"
          size="sm"
          :disabled="isSubscribing"
          @click="handleSubscribe"
        >
          <Loader2 v-if="isSubscribing" class="mr-2 size-4 animate-spin" />
          Activar
        </Button>
        <Button
          v-else-if="isSupported && isSubscribed"
          size="sm"
          variant="outline"
          :disabled="isUnsubscribing"
          @click="handleUnsubscribe"
        >
          <Loader2 v-if="isUnsubscribing" class="mr-2 size-4 animate-spin" />
          Desactivar
        </Button>
      </div>
    </Card>

    <!-- Category Preferences -->
    <Card class="divide-y">
      <div class="p-4">
        <h2 class="text-sm font-medium">Categorías</h2>
        <p class="text-xs text-muted-foreground">Elige qué tipo de notificaciones recibir</p>
      </div>

      <!-- Loading skeleton -->
      <template v-if="isLoading">
        <div v-for="i in 7" :key="i" class="flex items-center justify-between p-4">
          <div class="space-y-2">
            <Skeleton class="h-4 w-28" />
            <Skeleton class="h-3 w-48" />
          </div>
          <Skeleton class="h-5 w-9 rounded-lg" />
        </div>
      </template>

      <!-- Category toggles -->
      <template v-else-if="preferences">
        <div
          v-for="cat in PUSH_CATEGORIES"
          :key="cat.key"
          class="flex items-center justify-between p-4"
        >
          <div class="space-y-0.5 pr-4">
            <Label :for="`push-${cat.key}`" class="text-sm font-medium cursor-pointer">
              {{ cat.label }}
            </Label>
            <p class="text-xs text-muted-foreground">{{ cat.description }}</p>
          </div>
          <Switch
            :id="`push-${cat.key}`"
            :model-value="preferences[cat.key]"
            :disabled="isSaving"
            @update:model-value="(val: boolean) => handleToggle(cat.key, val)"
          />
        </div>
      </template>

      <!-- Error state -->
      <div v-else-if="error" class="p-4 space-y-3">
        <ErrorAlert :message="error" />
        <div class="text-center">
          <Button variant="ghost" size="sm" @click="fetchPreferences">
            Reintentar
          </Button>
        </div>
      </div>
    </Card>

    <!-- Saving indicator -->
    <p v-if="isSaving" class="flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <Loader2 class="size-3 animate-spin" />
      Guardando...
    </p>
  </div>
</template>
