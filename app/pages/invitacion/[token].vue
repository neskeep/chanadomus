<script setup lang="ts">
import { CheckCircle, Clock, XCircle, Loader2, Eye, EyeOff } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { InvitationLookup, RegisterPayload } from '~~/shared/types/invitation'

definePageMeta({ layout: false })

const route = useRoute()
const token = route.params.token as string

const loading = ref(true)
const submitting = ref(false)
const registered = ref(false)
const lookup = ref<InvitationLookup | null>(null)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive<RegisterPayload & { confirmPassword: string }>({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

const errors = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const roleLabel = computed(() => {
  if (!lookup.value?.role) return ''
  return lookup.value.role === 'propietario' ? 'Propietario' : 'Conserje'
})

function validate(): boolean {
  let valid = true
  errors.name = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''

  if (!form.name.trim()) {
    errors.name = 'El nombre es requerido'
    valid = false
  }

  if (!form.email.trim()) {
    errors.email = 'El correo es requerido'
    valid = false
  }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Correo electrónico inválido'
    valid = false
  }

  if (!form.password) {
    errors.password = 'La contraseña es requerida'
    valid = false
  }
  else if (form.password.length < 8) {
    errors.password = 'Mínimo 8 caracteres'
    valid = false
  }

  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validate()) return

  submitting.value = true
  try {
    await $fetch(`/api/invitacion/${token}`, {
      method: 'POST',
      body: {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone?.trim() || undefined,
        password: form.password,
      } satisfies RegisterPayload,
    })
    registered.value = true
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al registrar'
    const fetchErr = err as { data?: { message?: string } }
    toast.error(fetchErr?.data?.message || message)
  }
  finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const response = await $fetch<{ data: InvitationLookup }>(`/api/invitacion/${token}`)
    lookup.value = response.data
  }
  catch {
    lookup.value = { status: 'invalid' }
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center bg-background px-4 py-8 md:justify-center">
    <!-- Header -->
    <div class="mb-6 flex justify-center md:mb-8">
      <AppLogo :height="48" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center gap-3">
      <Loader2 class="size-10 animate-spin text-muted-foreground" />
      <p class="text-sm text-muted-foreground">
        Verificando invitación...
      </p>
    </div>

    <!-- Registration Success -->
    <Card v-else-if="registered" class="w-full max-w-sm">
      <CardContent class="flex flex-col items-center gap-4 p-6 text-center">
        <div class="flex size-12 items-center justify-center rounded-lg bg-primary/10">
          <CheckCircle class="size-6 text-primary" />
        </div>
        <div class="space-y-1">
          <p class="text-lg font-semibold">
            Registro exitoso
          </p>
          <p class="text-sm text-muted-foreground">
            Tu cuenta ha sido creada. Ya puedes iniciar sesión.
          </p>
        </div>
        <Button as-child class="mt-2 h-11 w-full text-base font-semibold">
          <NuxtLink to="/login">
            Iniciar sesión
          </NuxtLink>
        </Button>
      </CardContent>
    </Card>

    <!-- Pending: Registration Form -->
    <template v-else-if="lookup?.status === 'pending'">
      <!-- Invitation context -->
      <div class="mb-6 w-full max-w-sm rounded-lg border bg-card px-4 py-3 text-center">
        <p class="text-sm text-muted-foreground">Fuiste invitado como</p>
        <p class="mt-1 flex items-center justify-center gap-2">
          <Badge variant="default">{{ roleLabel }}</Badge>
          <span class="text-sm font-medium text-foreground">
            {{ lookup.unitLabel || lookup.unitNumber }}
          </span>
        </p>
      </div>

      <!-- Form -->
      <form class="flex w-full max-w-sm flex-col gap-5" @submit.prevent="handleSubmit">
        <!-- Name -->
        <div class="flex flex-col gap-2">
          <Label for="name" class="text-sm font-medium">Nombre completo</Label>
          <Input
            id="name"
            v-model="form.name"
            placeholder="Tu nombre completo"
            autocomplete="name"
            class="h-11 text-base"
            :class="errors.name ? 'border-destructive' : ''"
          />
          <p v-if="errors.name" class="text-xs text-destructive">
            {{ errors.name }}
          </p>
        </div>

        <!-- Email -->
        <div class="flex flex-col gap-2">
          <Label for="email" class="text-sm font-medium">Correo electrónico</Label>
          <Input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="correo@ejemplo.com"
            autocomplete="email"
            class="h-11 text-base"
            :class="errors.email ? 'border-destructive' : ''"
          />
          <p v-if="errors.email" class="text-xs text-destructive">
            {{ errors.email }}
          </p>
        </div>

        <!-- Phone -->
        <div class="flex flex-col gap-2">
          <Label for="phone" class="text-sm font-medium">
            Teléfono
            <span class="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="phone"
            v-model="form.phone"
            type="tel"
            placeholder="+58 412 1234567"
            autocomplete="tel"
            class="h-11 text-base"
          />
        </div>

        <!-- Password -->
        <div class="flex flex-col gap-2">
          <Label for="password" class="text-sm font-medium">Contraseña</Label>
          <div class="relative">
            <Input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Mínimo 8 caracteres"
              autocomplete="new-password"
              class="h-11 pr-12 text-base"
              :class="errors.password ? 'border-destructive' : ''"
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
          <p v-if="errors.password" class="text-xs text-destructive">
            {{ errors.password }}
          </p>
        </div>

        <!-- Confirm Password -->
        <div class="flex flex-col gap-2">
          <Label for="confirmPassword" class="text-sm font-medium">Confirmar contraseña</Label>
          <div class="relative">
            <Input
              id="confirmPassword"
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Repite tu contraseña"
              autocomplete="new-password"
              class="h-11 pr-12 text-base"
              :class="errors.confirmPassword ? 'border-destructive' : ''"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground"
              :aria-label="showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <EyeOff v-if="showConfirmPassword" class="size-5" />
              <Eye v-else class="size-5" />
            </button>
          </div>
          <p v-if="errors.confirmPassword" class="text-xs text-destructive">
            {{ errors.confirmPassword }}
          </p>
        </div>

        <Button
          type="submit"
          class="mt-2 h-11 w-full text-base font-semibold"
          :disabled="submitting"
        >
          <Loader2 v-if="submitting" class="mr-2 size-4 animate-spin" />
          {{ submitting ? 'Registrando...' : 'Crear cuenta' }}
        </Button>
      </form>
    </template>

    <!-- Used -->
    <Card v-else-if="lookup?.status === 'used'" class="w-full max-w-sm">
      <CardContent class="flex flex-col items-center gap-3 p-6 text-center">
        <div class="flex size-12 items-center justify-center rounded-lg bg-primary/10">
          <CheckCircle class="size-6 text-primary" />
        </div>
        <p class="text-lg font-semibold">
          Invitación ya utilizada
        </p>
        <p class="text-sm text-muted-foreground">
          Esta invitación ya fue usada para crear una cuenta.
        </p>
        <Button as-child variant="outline" class="mt-2">
          <NuxtLink to="/login">
            Ir a iniciar sesión
          </NuxtLink>
        </Button>
      </CardContent>
    </Card>

    <!-- Expired -->
    <Card v-else-if="lookup?.status === 'expired'" class="w-full max-w-sm">
      <CardContent class="flex flex-col items-center gap-3 p-6 text-center">
        <div class="flex size-12 items-center justify-center rounded-lg bg-yellow-500/10">
          <Clock class="size-6 text-yellow-500" />
        </div>
        <p class="text-lg font-semibold">
          Invitación expirada
        </p>
        <p class="text-sm text-muted-foreground">
          Este enlace ha expirado. Solicita al administrador que genere una nueva invitación.
        </p>
      </CardContent>
    </Card>

    <!-- Revoked -->
    <Card v-else-if="lookup?.status === 'revoked'" class="w-full max-w-sm">
      <CardContent class="flex flex-col items-center gap-3 p-6 text-center">
        <div class="flex size-12 items-center justify-center rounded-lg bg-destructive/10">
          <XCircle class="size-6 text-destructive" />
        </div>
        <p class="text-lg font-semibold">
          Invitación revocada
        </p>
        <p class="text-sm text-muted-foreground">
          Esta invitación fue cancelada. Contacta al administrador para más información.
        </p>
      </CardContent>
    </Card>

    <!-- Invalid -->
    <Card v-else class="w-full max-w-sm">
      <CardContent class="flex flex-col items-center gap-3 p-6 text-center">
        <div class="flex size-12 items-center justify-center rounded-lg bg-destructive/10">
          <XCircle class="size-6 text-destructive" />
        </div>
        <p class="text-lg font-semibold">
          Enlace inválido
        </p>
        <p class="text-sm text-muted-foreground">
          Este enlace de invitación no existe o no es válido.
        </p>
      </CardContent>
    </Card>

  </div>
</template>
