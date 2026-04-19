/**
 * Composable para gestionar suscripcion a push notifications (Web Push VAPID).
 *
 * - Solicita permiso de notificaciones
 * - Registra el service worker si no existe
 * - Suscribe al usuario via POST /api/push/subscribe
 */
export function usePushNotifications() {
  const isSupported = ref(false)
  const permission = ref<NotificationPermission>('default')
  const isSubscribed = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  onMounted(() => {
    isSupported.value = 'serviceWorker' in navigator && 'PushManager' in window
    if (isSupported.value) {
      permission.value = Notification.permission
    }
  })

  /**
   * Solicita permiso y suscribe al usuario a push notifications.
   * Llamar despues de login exitoso o cuando el usuario lo active manualmente.
   */
  async function subscribe() {
    if (!isSupported.value) {
      error.value = 'Push notifications no soportadas en este navegador'
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      // 1. Solicitar permiso
      const perm = await Notification.requestPermission()
      permission.value = perm

      if (perm !== 'granted') {
        error.value = 'Permiso de notificaciones denegado'
        return false
      }

      // 2. Obtener VAPID public key del servidor
      const { data: vapidData } = await $fetch<{ data: { publicKey: string } }>('/api/push/vapid-key')
      const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey)

      // 3. Registrar/obtener service worker
      const registration = await navigator.serviceWorker.ready

      // 4. Suscribir al PushManager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      })

      // 5. Enviar suscripcion al servidor
      const subJson = subscription.toJSON()
      await $fetch('/api/push/subscribe', {
        method: 'POST',
        body: {
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys!.p256dh,
            auth: subJson.keys!.auth,
          },
        },
      })

      isSubscribed.value = true
      return true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al suscribir a notificaciones'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Verifica si el usuario ya tiene una suscripcion activa.
   */
  async function checkSubscription() {
    if (!isSupported.value) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      isSubscribed.value = !!subscription
    } catch {
      isSubscribed.value = false
    }
  }

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    checkSubscription,
  }
}

/** Convierte VAPID key de base64url a Uint8Array para applicationServerKey */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
