const CACHE_NAME = 'cicerone-cache-v3'; // Incrementata la versione per aggiornare la cache sui dispositivi

// Mettiamo in cache iniziale solo i file testuali indispensabili
const ASSETS_TO_CACHE = [
  './Cicerone_Lazio_audiomappeok5.html', //[cite: 2]
  './manifest.json', //[cite: 2]
  './Leaflet/leaflet.css', //[cite: 2]
  './Leaflet/leaflet.js' //[cite: 2]
];

// 1. Installazione[cite: 2]
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Pre-caching file di sistema...'); //[cite: 2]
      return cache.addAll(ASSETS_TO_CACHE); //[cite: 2]
    }).then(() => self.skipWaiting()) //[cite: 2]
  );
});

// 2. Attivazione e pulizia vecchie cache[cite: 2]
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Rimozione vecchia cache:', cache); //[cite: 2]
            return caches.delete(cache); //[cite: 2]
          }
        })
      );
    }).then(() => self.clients.claim()) //[cite: 2]
  );
});

// 3. Gestione intelligente delle richieste (Mappe, Foto e File)[cite: 2]
self.addEventListener('fetch', (event) => {
  // Sicurezza: Ignora richieste non HTTP (es. estensioni del browser)[cite: 2]
  if (!event.request.url.startsWith('http')) return; //[cite: 2]

  // Se la richiesta va verso siti esterni, lasciala passare direttamente su internet[cite: 2]
  if (!event.request.url.startsWith(self.location.origin)) {
    return; //[cite: 2]
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Se il file è già in cache, lo restituisce subito[cite: 2]
      if (cachedResponse) {
        return cachedResponse; //[cite: 2]
      }

      // Altrimenti tenta di prenderlo dal server locale/GitHub[cite: 2]
      return fetch(event.request).then((networkResponse) => {
        // Se la risposta è valida, la duplica e la mette in cache per la prossima volta[cite: 2]
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone(); //[cite: 2]
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache); //[cite: 2]
          });
        }
        return networkResponse; //[cite: 2]
      }).catch((err) => {
        console.warn('Risorsa non trovata o offline:', event.request.url); //[cite: 2]
        
        // MODIFICA STRUTTURALE: Se l'app sta cercando un file .geojson ed è offline,
        // restituiamo un JSON vuoto valido `{}` invece di una stringa di testo.
        if (event.request.url.endsWith('.geojson')) {
          return new Response('{}', {
            status: 404,
            statusText: 'Not Found',
            headers: new Headers({ 'Content-Type': 'application/json' })
          });
        }

        // Per tutte le altre risorse (immagini, mappe, ecc.) restituisce il comportamento standard[cite: 2]
        return new Response('Risorsa non disponibile offline', {
          status: 404,
          statusText: 'Not Found',
          headers: new Headers({ 'Content-Type': 'text/plain' }) //[cite: 2]
        });
      });
    })
  );
});