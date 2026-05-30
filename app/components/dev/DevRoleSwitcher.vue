<script setup lang="ts">
import { Shield, HardHat, Home, Settings, ChevronUp, Loader2 } from 'lucide-vue-next'
import { ROLE_LABELS, type UserRole } from '~~/shared/types/auth'
import { authClient } from '~/lib/auth-client'

const { role } = useAuth()

const isOpen = ref(false)
const isSwitching = ref(false)
const switchingTo = ref<UserRole | null>(null)

const DEV_USERS: { role: UserRole; email: string; password: string; icon: typeof Shield; color: string }[] = [
  { role: 'admin', email: 'admin@chanadomus.com', password: 'Yolo2026!', icon: Settings, color: 'bg-emerald-500' },
  { role: 'propietario', email: 'propietario@chanadomus.com', password: 'Yolo2026!', icon: Home, color: 'bg-blue-500' },
  { role: 'conserje', email: 'conserje@chanadomus.com', password: 'Yolo2026!', icon: HardHat, color: 'bg-orange-500' },
  { role: 'vigilancia', email: 'vigilante@chanadomus.com', password: 'Yolo2026!', icon: Shield, color: 'bg-purple-500' },
]

const currentRoleColor = computed(() =>
  DEV_USERS.find(u => u.role === role.value)?.color ?? 'bg-zinc-500',
)

async function switchTo(target: typeof DEV_USERS[number]) {
  if (target.role === role.value) {
    isOpen.value = false
    return
  }

  isSwitching.value = true
  switchingTo.value = target.role

  try {
    await authClient.signOut()
    await authClient.signIn.email({ email: target.email, password: target.password })
    reloadNuxtApp({ ttl: 1000 })
  }
  catch (err) {
    console.error('[DevRoleSwitcher] Error switching role:', err)
    isSwitching.value = false
    switchingTo.value = null
  }
}
</script>

<template>
  <div class="fixed bottom-[7.5rem] right-4 z-[9999] flex flex-col items-end md:bottom-[3.5rem]">
    <!-- Expanded panel -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="translate-y-2 scale-95 opacity-0"
      enter-to-class="translate-y-0 scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="translate-y-0 scale-100 opacity-100"
      leave-to-class="translate-y-2 scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="mb-2 ml-auto w-52 overflow-hidden rounded-xl border bg-popover shadow-xl"
      >
        <p class="border-b px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Cambiar rol
        </p>
        <div class="p-1">
          <button
            v-for="u in DEV_USERS"
            :key="u.role"
            :disabled="isSwitching"
            class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50"
            :class="u.role === role ? 'bg-muted font-medium' : ''"
            @click="switchTo(u)"
          >
            <div class="flex size-7 items-center justify-center rounded-md" :class="u.color">
              <component :is="u.icon" class="size-3.5 text-white" />
            </div>
            <span class="flex-1">{{ ROLE_LABELS[u.role] }}</span>
            <Loader2
              v-if="switchingTo === u.role"
              class="size-3.5 animate-spin text-muted-foreground"
            />
            <span
              v-else-if="u.role === role"
              class="size-1.5 rounded-full bg-primary"
            />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Trigger pill -->
    <button
      :disabled="isSwitching"
      class="flex items-center gap-2 rounded-full border bg-popover px-3 py-1.5 shadow-lg transition-all hover:shadow-xl disabled:opacity-70"
      @click="isOpen = !isOpen"
    >
      <span class="size-2.5 rounded-full" :class="currentRoleColor" />
      <span class="text-xs font-semibold">
        {{ role ? ROLE_LABELS[role] : 'Dev' }}
      </span>
      <ChevronUp
        class="size-3 text-muted-foreground transition-transform"
        :class="isOpen ? '' : 'rotate-180'"
      />
    </button>
  </div>
</template>
