<script setup lang="ts">
import { Building2 } from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })

const { signIn } = useAuth()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

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
    <div class="mb-8 text-center">
      <div class="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10">
        <Building2 class="size-7 text-primary" />
      </div>
      <h1 class="text-3xl font-semibold tracking-tight text-primary">ChanaDomus</h1>
      <p class="mt-1 text-sm text-muted-foreground">Gestión Condominial</p>
    </div>

    <!-- Login Card -->
    <Card class="shadow-lg">
      <CardContent class="p-6 sm:p-8">
        <h2 class="mb-5 text-lg font-medium text-foreground">Iniciar sesión</h2>

        <form class="flex flex-col gap-5" @submit.prevent="handleSubmit">
          <!-- Error -->
          <div v-if="error" class="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {{ error }}
          </div>

          <div class="flex flex-col gap-2">
            <Label for="email">Correo electrónico</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="tu@email.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="flex flex-col gap-2">
            <Label for="password">Contraseña</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
          </div>

          <Button type="submit" class="mt-2 h-11 w-full" :disabled="loading">
            {{ loading ? 'Ingresando...' : 'Ingresar' }}
          </Button>
        </form>
      </CardContent>
    </Card>

    <!-- Footer -->
    <div class="mt-6">
      <Separator class="mb-4" />
      <p class="text-center text-xs text-muted-foreground">
        Ranchos de Chana &middot; Acceso exclusivo para residentes
      </p>
    </div>
  </div>
</template>
