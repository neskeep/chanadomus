// ChanaDomus Service Worker — Push Notifications
// Este SW se extendera en M1.6 con caching/offline support

const APP_ICON = '/favicon.ico'
const APP_BADGE = '/favicon.ico'

// Push event: recibe payload JSON del servidor y muestra notificacion nativa
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = {
      title: 'ChanaDomus',
      body: event.data.text(),
    }
  }

  const options = {
    body: payload.body || '',
    icon: payload.icon || APP_ICON,
    badge: payload.badge || APP_BADGE,
    data: {
      url: payload.url || '/',
      category: payload.category || 'general',
    },
    vibrate: [200, 100, 200],
    tag: payload.category || 'chanadomus',
    renotify: true,
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'ChanaDomus', options)
  )
})

// Notification click: abre la ruta relevante de la PWA
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta, navegar a la ruta
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      return self.clients.openWindow(url)
    })
  )
})

// Activate: tomar control inmediato
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
