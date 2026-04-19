// ChanaDomus Service Worker — Push Notifications + PWA Caching

const APP_ICON = '/icons/icon.svg'
const APP_BADGE = '/favicon.ico'

// ─── Cache & Offline Support ───────────────────────────────────────────────────

const CACHE_NAME = 'chanadomus-v1'
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon.svg',
  '/favicon.ico',
]

// Install: precache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// Fetch: network-first for API, stale-while-revalidate for static
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // API calls: network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
    return
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      }).catch(() => cached)
      return cached || fetched
    })
  )
})

// ─── Push Notifications ────────────────────────────────────────────────────────

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

// Activate: clean old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      ),
      // Take control
      self.clients.claim(),
    ])
  )
})
