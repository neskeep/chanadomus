<script setup lang="ts">
import { Bell, BellOff, Loader2 } from 'lucide-vue-next'
import { PUSH_CATEGORIES } from '~~/shared/types/push-preferences'
import type { PushCategory } from '~~/shared/types/push-preferences'

const { preferences, isLoading, isSaving, error, fetchPreferences, toggleCategory } = usePushPreferences()
const { isSupported, permission, isSubscribed, subscribe, checkSubscription } = usePushNotifications()

const isSubscribing = ref(false)

async function handleSubscribe() {
  isSubscribing.value = true
  await subscribe()
  isSubscribing.value = false
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
  <div class="mx-auto max-w-lg space-y-6">
    <div>
      <h1 class="text-lg font-semibold tracking-tight">Notificaciones</h1>
      <p class="text-sm text-muted-foreground">Configura qué notificaciones push deseas recibir</p>
    </div>

    <!-- Push Subscription Status -->
    <Card class="p-4">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div :class="[
            'flex size-10 items-center justify-center rounded-full',
            isSubscribed ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
          ]">
            <Bell v-if="isSubscribed" class="size-5" />
            <BellOff v-else class="size-5" />
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
          <Skeleton class="h-5 w-9 rounded-full" />
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
            :checked="preferences[cat.key]"
            :disabled="isSaving"
            @update:checked="(val: boolean) => handleToggle(cat.key, val)"
          />
        </div>
      </template>

      <!-- Error state -->
      <div v-else-if="error" class="p-4 text-center">
        <p class="text-sm text-destructive">{{ error }}</p>
        <Button variant="ghost" size="sm" class="mt-2" @click="fetchPreferences">
          Reintentar
        </Button>
      </div>
    </Card>

    <!-- Saving indicator -->
    <p v-if="isSaving" class="flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <Loader2 class="size-3 animate-spin" />
      Guardando...
    </p>
  </div>
</template>
