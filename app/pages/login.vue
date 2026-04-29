<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })

const { signIn } = useAuth()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await signIn(email.value, password.value)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <!-- Branding -->
    <div class="mb-8 flex justify-center md:mb-10">
      <AppLogo :height="48" />
    </div>

    <!-- Form -->
    <form class="flex flex-col gap-5 md:gap-6" @submit.prevent="handleSubmit">
      <!-- Error -->
      <div
        v-if="error"
        role="alert"
        class="rounded-lg bg-destructive/10 px-4 py-3 text-base text-destructive"
      >
        {{ error }}
      </div>

      <div class="flex flex-col gap-2">
        <Label for="email" class="text-sm font-medium md:text-base">Correo electrónico</Label>
        <Input
          id="email"
          v-model="email"
          type="email"
          placeholder="joe.doe@chanadomus.com"
          required
          autocomplete="email"
          class="h-11 text-base md:h-14 md:text-lg"
        />
      </div>

      <div class="flex flex-col gap-2">
        <Label for="password" class="text-sm font-medium md:text-base">Contraseña</Label>
        <div class="relative">
          <Input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            required
            autocomplete="current-password"
            class="h-11 pr-12 text-base md:h-14 md:text-lg"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground"
            :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" class="size-5" />
            <Eye v-else class="size-5" />
          </button>
        </div>
      </div>

      <Button
        type="submit"
        variant="default"
        class="mt-2 h-11 w-full text-base font-semibold md:h-14 md:text-lg"
        :disabled="loading"
      >
        {{ loading ? 'Ingresando...' : 'Ingresar' }}
      </Button>
    </form>
  </div>
</template>
