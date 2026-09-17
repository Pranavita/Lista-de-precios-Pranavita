// Service Worker de Pranavita — permite seguir viendo la lista y comprando
// aunque se pierda la señal, siempre que se haya abierto al menos una vez
// con conexión. No hace falta instalar nada: el navegador lo activa solo.
//
// Si en el futuro cambiás la estructura del sitio (por ejemplo, agregás
// nuevos archivos que también deban guardarse), subí el número de
// CACHE_NAME (v1 -> v2) para que los navegadores refresquen la copia guardada.
const CACHE_NAME = 'pranavita-cache-v1';
const CORE_ASSETS = ['./', 'index.html', 'productos.csv', 'clasificacion.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => { /* si algo falla al precargar, no rompe la instalación */ })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isData = url.pathname.endsWith('productos.csv') || url.pathname.endsWith('clasificacion.json');
  const isPage = url.pathname.endsWith('index.html') || url.pathname.endsWith('/');

  if (isData || isPage) {
    // Página principal y datos de productos: siempre tratar de traer lo
    // más nuevo primero, pidiéndole al navegador que ignore cualquier
    // copia intermedia propia (cache:'no-store') y vaya directo a
    // GitHub. Si no hay conexión, ahí sí se muestra la última copia
    // guardada en vez de fallar.
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Todo lo demás (fotos de productos, etc.): usar la copia guardada si
  // existe, y guardar una copia nueva la primera vez que se pide con señal.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
