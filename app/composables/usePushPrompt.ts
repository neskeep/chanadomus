import { toast } from 'vue-sonner'

/**
 * Aviso descartable para activar notificaciones push en este dispositivo.
 *
 * Decide que variante mostrar (o ninguna) a partir de:
 * - soporte del navegador y permiso actual (via usePushNotifications)
 * - plataforma: iOS solo admite push si la app esta instalada en la pantalla de inicio
 * - si ya hay una suscripcion activa en este dispositivo
 * - si el usuario lo pospuso con "Ahora no" (7 dias, localStorage)
 *
 * El componente PushPrompt solo renderiza el estado que devuelve este composable.
 */

export type PushPromptState = 'hidden' | 'enable' | 'ios-install' | 'denied'

export const PUSH_PROMPT_SNOOZE_KEY = 'push-prompt-snoozed-until'
export const PUSH_PROMPT_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000
export const PUSH_SETTINGS_PATH = '/mi-chana/notificaciones'

export interface PushPromptInput {
  ready: boolean
  isSupported: boolean
  permission: NotificationPermission
  isSubscribed: boolean
  isIos: boolean
  isStandalone: boolean
  snoozed: boolean
}

/** Funcion pura: que variante del aviso corresponde. */
export function resolvePushPromptState(input: PushPromptInput): PushPromptState {
  if (!input.ready || input.snoozed || input.isSubscribed) return 'hidden'
  // En iOS sin instalar, PushManager no existe: primero hay que instalar la app.
  if (input.isIos && !input.isStandalone) return 'ios-install'
  if (!input.isSupported) return 'hidden'
  if (input.permission === 'denied') return 'denied'
  return 'enable'
}

/** iPhone, iPod o iPad (iPadOS se presenta como Mac con pantalla tactil). */
export function isIosDevice(userAgent: string, platform: string, maxTouchPoints: number): boolean {
  if (/iPad|iPhone|iPod/.test(userAgent)) return true
  return platform === 'MacIntel' && maxTouchPoints > 1
}

/** true si la fecha guardada sigue en el futuro. */
export function isSnoozeActive(storedValue: string | null, now: number): boolean {
  if (!storedValue) return false
  const until = Number(storedValue)
  return Number.isFinite(until) && until > now
}

function readSnooze(): string | null {
  try {
    return localStorage.getItem(PUSH_PROMPT_SNOOZE_KEY)
  }
  catch {
    return null
  }
}

function writeSnooze(until: number) {
  try {
    localStorage.setItem(PUSH_PROMPT_SNOOZE_KEY, String(until))
  }
  catch {
    // almacenamiento bloqueado: el aviso se oculta solo en esta sesion
  }
}

/** Busca la suscripcion sin esperar a navigator.serviceWorker.ready (que puede no resolver nunca). */
async function hasActiveSubscription(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) return false
    return !!(await registration.pushManager.getSubscription())
  }
  catch {
    return false
  }
}

/** Deteccion de plataforma para el aviso de instalacion en iPhone. */
export function usePwaPlatform() {
  const isIos = ref(false)
  const isStandalone = ref(false)

  onMounted(() => {
    const nav = navigator as Navigator & { standalone?: boolean }
    isIos.value = isIosDevice(nav.userAgent, nav.platform, nav.maxTouchPoints)
    isStandalone.value = nav.standalone === true
      || window.matchMedia('(display-mode: standalone)').matches
  })

  /** iPhone o iPad abierto desde el navegador: hay que instalar la app para recibir push. */
  const needsIosInstall = computed(() => isIos.value && !isStandalone.value)

  return { isIos, isStandalone, needsIosInstall }
}

export function usePushPrompt() {
  const route = useRoute()
  const push = usePushNotifications()
  const { isIos, isStandalone } = usePwaPlatform()

  const ready = ref(false)
  const snoozed = ref(false)
  const dismissedNow = ref(false)

  onMounted(async () => {
    snoozed.value = isSnoozeActive(readSnooze(), Date.now())
    if (push.isSupported.value) {
      push.isSubscribed.value = await hasActiveSubscription()
    }
    ready.value = true
  })

  const state = computed<PushPromptState>(() => {
    // La pagina de ajustes ya muestra su propio estado
    if (dismissedNow.value || route.path.startsWith(PUSH_SETTINGS_PATH)) return 'hidden'
    return resolvePushPromptState({
      ready: ready.value,
      isSupported: push.isSupported.value,
      permission: push.permission.value,
      isSubscribed: push.isSubscribed.value,
      isIos: isIos.value,
      isStandalone: isStandalone.value,
      snoozed: snoozed.value,
    })
  })

  async function enable() {
    const ok = await push.subscribe()
    if (ok) {
      toast.success('Notificaciones activadas', {
        description: 'Te avisaremos en este dispositivo.',
      })
      return
    }
    // Si el permiso quedo en 'denied', el aviso cambia solo a la variante bloqueada
    if (push.permission.value !== 'denied') {
      toast.error('No se pudieron activar las notificaciones', {
        description: 'Inténtalo de nuevo en unos minutos.',
      })
    }
  }

  function snooze() {
    writeSnooze(Date.now() + PUSH_PROMPT_SNOOZE_MS)
    dismissedNow.value = true
  }

  return {
    state,
    isIos,
    isLoading: push.isLoading,
    settingsPath: PUSH_SETTINGS_PATH,
    enable,
    snooze,
  }
}
