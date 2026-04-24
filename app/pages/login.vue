<script setup lang="ts">
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
    <div class="mb-10 text-center">
      <p class="text-lg text-muted-foreground">Bienvenido</p>
      <h1 class="text-3xl font-bold text-primary">ChanaDomus</h1>
      <p class="mt-1 text-base text-muted-foreground">Ranchos de Chana</p>
    </div>

    <!-- Login Card -->
    <Card class="shadow-lg">
      <CardContent class="p-6 sm:p-8">
        <h2 class="mb-5 text-lg font-medium text-foreground">Iniciar sesión</h2>

        <form class="flex flex-col gap-6" @submit.prevent="handleSubmit">
          <!-- Error -->
          <div v-if="error" class="rounded-lg bg-destructive/10 px-3 py-2 text-base text-destructive">
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
              class="h-12 text-base"
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
              class="h-12 text-base"
            />
          </div>

          <Button type="submit" class="mt-3 h-12 w-full text-base font-semibold" :disabled="loading">
            {{ loading ? 'Ingresando...' : 'Ingresar' }}
          </Button>
        </form>
      </CardContent>
    </Card>

    <!-- Footer -->
    <div class="mt-6">
      <p class="text-center text-sm text-muted-foreground">
        Ranchos de Chana &middot; Acceso exclusivo para residentes
      </p>
    </div>
  </div>
</template>
