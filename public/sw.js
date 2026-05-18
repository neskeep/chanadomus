// ChanaDomus Service Worker — Push Notifications + Offline Caching

const CACHE_NAME = 'chanadomus-v1'
const APP_ICON = '/favicon.ico'
const APP_BADGE = '/favicon.ico'

// App shell resources to pre-cache on install
const APP_SHELL = [
  '/',
  '/login',
  '/offline',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// --- Install: skip waiting, no pre-cache in dev ---
self.addEventListener('install', () => {
  self.skipWaiting()
})

// --- Activate: clean old caches + claim clients ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((name) => caches.delete(name)))
    }).then(() => self.clients.claim())
  )
})

// --- Fetch: passthrough (no caching in dev) ---
// All fetch events pass through to the network directly.
// Caching strategies are commented out for development.
// self.addEventListener('fetch', ...) — intentionally removed

// --- Caching strategies ---

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached
    return fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
      }
      return response
    })
  })
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok && request.method === 'GET') {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
      }
      return response
    })
    .catch(() => {
      if (request.method === 'GET') {
        return caches.match(request)
      }
      return new Response(JSON.stringify({ error: 'Offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    })
}

function networkFirstWithOfflineFallback(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
      }
      return response
    })
    .catch(() => {
      return caches.match(request).then((cached) => {
        return cached || caches.match('/offline')
      })
    })
}

function isStaticAsset(pathname) {
  // Nuxt build output
  if (pathname.startsWith('/_nuxt/')) return true
  // Static file extensions
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif)$/.test(pathname)
}

// --- Push Notifications ---

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
