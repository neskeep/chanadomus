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

// --- Install: pre-cache app shell ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL)
    })
  )
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting()
})

// --- Activate: clean up old caches + claim clients ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// --- Fetch: caching strategies ---
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // API calls: network-first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Static assets (Nuxt build output, icons, fonts, images): cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // HTML pages: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request))
    return
  }

  // Everything else: network-first
  event.respondWith(networkFirst(request))
})

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
      if (response.ok) {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
      }
      return response
    })
    .catch(() => {
      return caches.match(request)
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
