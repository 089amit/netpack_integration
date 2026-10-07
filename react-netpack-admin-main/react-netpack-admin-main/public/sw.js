// Netpack Logistics - Customer PWA Service Worker
// Enables PWA installation, caching, and offline support

const CACHE_NAME = 'netpack-customer-v2'
const PRECACHE_URLS = [
  '/',
  '/pwa',
  '/manifest.webmanifest',
  '/images/netpack-icon-192.png',
  '/images/netpack-icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {})
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch listener required for PWA installation
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {})
          })
        }
        return networkResponse
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/pwa') || caches.match('/')
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' })
        })
      })
  )
})

// Handle system / web push notification clicks: navigate directly to shipment tracking
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const trackingNumber = event.notification.data?.tracking
  const targetPath = trackingNumber ? `/pwa?track=${encodeURIComponent(trackingNumber)}` : '/pwa'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/pwa') && 'focus' in client) {
          if (trackingNumber && 'navigate' in client) {
            client.navigate(targetPath)
          }
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetPath)
      }
    })
  )
})

