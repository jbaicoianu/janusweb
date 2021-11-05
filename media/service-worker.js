self.addEventListener('activate', function(event) {
  return self.clients.claim();
});

self.addEventListener('fetch', ev => {
  return ev.respondWith(fetch(ev.request));
});
