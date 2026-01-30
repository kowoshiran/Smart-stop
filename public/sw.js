// Service Worker pour Smart Stop PWA
const CACHE_NAME = 'smart-stop-v1'

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installé')
  self.skipWaiting()
})

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activé')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression ancien cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  return self.clients.claim()
})

// Stratégie: Network First, puis Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cloner la réponse car elle ne peut être lue qu'une fois
        const responseClone = response.clone()

        // Mettre en cache les réponses réussies
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }

        return response
      })
      .catch(() => {
        // Si le réseau échoue, essayer le cache
        return caches.match(event.request)
      })
  )
})
