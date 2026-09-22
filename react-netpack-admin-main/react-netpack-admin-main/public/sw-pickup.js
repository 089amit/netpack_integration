// Netpack Logistics - Pickup Rider Service Worker
// Handles Push Notifications, Background Sync, PWA Installation, and Network Lifecycle

const CACHE_NAME = 'netpack-rider-v2'
const PRECACHE_URLS = [
  '/pickup-pwa',
  '/manifest-pickup.webmanifest',
  '/images/netpack-rider-icon-192.png',
  '/images/netpack-rider-icon-512.png',
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

// Fetch event listener required by Chrome for PWA installation criteria
self.addEventListener('fetch', (event) => {
  // Pass through non-GET and API requests directly
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
            return caches.match('/pickup-pwa')
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' })
        })
      })
  )
})

// Listen for Web Push events
self.addEventListener('push', (event) => {
  let data = {
    title: '🚚 New Pickup Request!',
    body: 'A new cargo pickup has been requested in your area.',
    trackingNumber: '',
    sender: '',
    address: '',
    url: '/pickup-pwa',
  }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch (e) {
      data.body = event.data.text() || data.body
    }
  }

  const options = {
    body: data.body || `${data.sender || 'Customer'} - ${data.address || 'Kathmandu'}`,
    icon: '/images/netpack-rider-icon-192.png',
    badge: '/images/netpack-rider-icon-192.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: data.trackingNumber || 'new-pickup-alert',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/pickup-pwa',
      id: data.id,
      trackingNumber: data.trackingNumber,
    },
    actions: [
      { action: 'open_pickup', title: '📍 View Pickup Details' },
      { action: 'close', title: 'Dismiss' },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Handle Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') return

  const targetUrl = (event.notification.data && event.notification.data.url) || '/pickup-pwa'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/pickup-pwa') && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: event.notification.data,
          })
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

// Allow page to request the service worker to display native notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data
    self.registration.showNotification(title, {
      icon: '/images/netpack-rider-icon-192.png',
      badge: '/images/netpack-rider-icon-192.png',
      vibrate: [250, 100, 250],
      ...options,
    })
  }
})
