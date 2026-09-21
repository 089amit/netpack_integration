// NetPack Logistics - Pickup Rider Service Worker
// Handles Push Notifications, Background Sync, and App Shell Lifecycle

const CACHE_NAME = 'netpack-rider-v1'
const PRECACHE_URLS = ['/pickup-pwa', '/manifest-pickup.webmanifest', '/alzlogo.png']

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
    icon: '/alzlogo.png',
    badge: '/images/favicon.png',
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
      // If a tab is already open to pickup-pwa, focus it
      for (const client of windowClients) {
        if (client.url.includes('/pickup-pwa') && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: event.notification.data,
          })
          return client.focus()
        }
      }
      // Otherwise open a new window
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
      icon: '/alzlogo.png',
      badge: '/images/favicon.png',
      vibrate: [250, 100, 250],
      ...options,
    })
  }
})
