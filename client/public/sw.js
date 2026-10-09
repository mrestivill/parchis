const CACHE_NAME = 'parchis-v0.9.31';
const RUNTIME_CACHE = 'parchis-runtime';

// Assets to cache on install
const PRECACHE_ASSETS = [
    '/icon-192.png',
    '/icon-512.png',
    '/favicon.ico'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    self.skipWaiting(); // Force activation immediately
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            // Also clear runtime cache on version change to prevent stale files
            return caches.delete(RUNTIME_CACHE);
        }).then(() => self.clients.claim())
    );
});

// Fetch event
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip WebSocket and API calls
    if (url.protocol === 'ws:' || url.protocol === 'wss:') return;
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) return;

    // Skip cross-origin requests (let browser handle them naturally)
    if (url.origin !== self.location.origin) return;

    // 1. Navigation (HTML) - Network Only (ensure fresh index.html)
    // We want to avoid caching index.html so user always gets latest version pointers
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => {
                return caches.match('/index.html') || caches.match('/'); // Fallback only if offline
            })
        );
        return;
    }

    // 2. JS/CSS Assets (Hashed) - Cache First, but check network if missing
    // IMPORTANT: Do NOT fall back to index.html for JS/CSS
    if (url.pathname.match(/\.(js|css)$/)) {
        event.respondWith(
            caches.open(RUNTIME_CACHE).then((cache) => {
                return fetch(request)
                    .then((networkResponse) => {
                        // Update cache with new version
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    })
                    .catch(() => {
                        // If offline/fail, try cache.
                        return caches.match(request);
                    });
            })
        );
        return;
    }

    // 3. Images/Other - Stale-While-Revalidate
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return caches.open(RUNTIME_CACHE).then((cache) => {
                return fetch(request).then((response) => {
                    return cache.put(request, response.clone()).then(() => {
                        return response;
                    });
                });
            });
        })
    );
});
