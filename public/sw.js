const CACHE_NAME = 'daily-quest-v2'
const OFFLINE_URLS = ['/dashboard', '/quests', '/rewards']

function shouldHandleRequest(request) {
  const url = new URL(request.url)
  return request.method === 'GET' &&
    url.origin === self.location.origin &&
    !url.pathname.startsWith('/api/') &&
    !url.pathname.startsWith('/_next/static/')
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (!shouldHandleRequest(event.request)) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response.ok) return response
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

if (typeof module !== 'undefined') module.exports = { shouldHandleRequest }
