// Caché para que la app abra sin cobertura (garajes, sótanos) y también cuando hay señal
// pero no llegan datos, que es lo habitual bajo tierra.
const CACHE = 'escuadra-v4';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-180.png'];
// El modelo de detección de coches pesa unos 18 MB: se guarda aparte y, si falla, la app sigue instalándose.
const MODELO = [
  './modelo/tf.min.js', './modelo/coco-ssd.min.js', './modelo/model.json',
  './modelo/group1-shard1of5', './modelo/group1-shard2of5', './modelo/group1-shard3of5',
  './modelo/group1-shard4of5', './modelo/group1-shard5of5',
];
const ESPERA_RED = 2500;   // ms que se espera a la red antes de tirar de caché

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES).then(() => c.addAll(MODELO).catch(() => {})))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function guardar(req, res) {
  if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res.clone())).catch(() => {});
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  // El modelo no cambia: caché primero, y si no está, red.
  if (req.url.includes('/modelo/')) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => guardar(req, res))));
    return;
  }

  // Resto de archivos: se intenta la red (para ver los cambios al desarrollar), pero si no
  // responde en un par de segundos o falla, se sirve la copia guardada. La red, si acaba
  // llegando, actualiza la caché para la próxima vez.
  e.respondWith(
    caches.match(req).then(enCache => {
      const red = fetch(req).then(res => guardar(req, res)).catch(() => null);
      if (!enCache) return red.then(res => res || new Response('Sin conexión y sin copia guardada. Abre la app una vez con internet.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }));
      const espera = new Promise(resolve => setTimeout(() => resolve(null), ESPERA_RED));
      return Promise.race([red, espera]).then(res => res || enCache);
    })
  );
});
