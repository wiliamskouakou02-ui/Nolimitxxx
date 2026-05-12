// NOLIMITXX Service Worker — Mode Hors-ligne
const CACHE_NAME = 'nolimitxx-v1';
const CACHE_URLS = [
  '/Nolimitxxx/',
  '/Nolimitxxx/index.html',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap',
];

// Installation — mise en cache des ressources essentielles
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('NOLIMITXX: Cache installé');
      return cache.addAll(CACHE_URLS).catch(err => {
        console.log('Cache partiel:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activation — nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Interception des requêtes — Cache First pour les assets, Network First pour le reste
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Si en cache, retourne le cache
      if (cachedResponse) {
        // Mise à jour en arrière-plan
        fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, response.clone());
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // Sinon, fetch depuis le réseau et met en cache
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Hors-ligne : retourne la page principale depuis le cache
        return caches.match('/Nolimitxxx/index.html');
      });
    })
  );
});
