var cacheName = 'chromium-vector-icon-app';
var filesToCache = [
  // TODO: MSW UPDATE CACHED FILE LIST. 
  // './',
  // './index.html',
  // './style.css',
  // './main.js'
  // './vector_icon.js'
];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
});

/* Serve cached content when offline */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
