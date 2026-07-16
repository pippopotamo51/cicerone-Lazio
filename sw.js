const CACHE_NAME = 'cicerone-cache-v2'; // Incrementata la versione per forzare l'aggiornamento

// Mettiamo in cache iniziale solo i file testuali indispensabili
const ASSETS_TO_CACHE = [
  './Cicerone_Lazio_audiomappeok5.html',
  './manifest.json',
  './Leaflet/leaflet.css',
  './Leaflet/leaflet.js'
];

// 1. Installazione
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Pre-caching file di sistema...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Attivazione e pulizia vecchie cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Rimozione vecchia cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Gestione intelligente delle richieste (Mappe, Foto e File)
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Se il file (mappa o foto) è già in cache, lo restituisce subito
      if (cachedResponse) {
        return cachedResponse;
      }

      // Altrimenti tenta di prenderlo dal server locale
      return fetch(event.request).then((networkResponse) => {
        // Se la risposta è valida, la duplica e la mette in cache per la prossima volta
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.warn('Risorsa non trovata o offline:', event.request.url);
        
        // CORREZIONE CRASH: Se siamo offline o il file non esiste, restituisce un errore HTTP pulito
        // Evita il crash "Failed to convert value to 'Response'"
        return new Response('Risorsa non disponibile offline', {
          status: 404,
          statusText: 'Not Found',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
    })
  );
});