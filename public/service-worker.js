// Service Worker do Top Cell Admin (PWA)
// Cacheia só os arquivos estáticos do app (pra abrir offline/instalar).
// Nunca cacheia chamadas ao Supabase — dados e fotos sempre vêm da rede.

const CACHE_NAME = "topcell-admin-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Supabase (dados/fotos) e qualquer outra origem -> sempre rede direto.
  if (!isSameOrigin) return;

  // Arquivos do próprio app -> cache-first com atualização em segundo plano.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
