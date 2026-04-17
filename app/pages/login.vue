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
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-bold tracking-tight text-primary">ChanaDomus</h1>
      <p class="mt-1 text-sm text-muted-foreground">Gestión Condominial</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
        <CardDescription>Ingresa tus credenciales para continuar</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
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

          <Button type="submit" class="mt-2 w-full" :disabled="loading">
            {{ loading ? 'Ingresando...' : 'Ingresar' }}
          </Button>
        </form>
      </CardContent>
    </Card>

    <p class="mt-6 text-center text-xs text-muted-foreground">
      Ranchos de Chana &middot; Acceso exclusivo para residentes
    </p>
  </div>
</template>
