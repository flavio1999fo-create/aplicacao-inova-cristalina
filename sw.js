/* Service Worker do Aplicativo de Aplicação Inova Genética — Cristalina
   18/09/2026, a pedido do Flávio: deixar o app abrir mesmo sem sinal no campo (hoje era só
   uma página normal do navegador — sem isso, sem internet a tela simplesmente não carregava).

   Estratégia (rede primeiro, cache como reserva):
   - Com internet: sempre busca a versão mais nova na rede (assim nunca mostra uma cópia velha
     por engano enquanto o sinal tá bom) e guarda essa cópia no cache pra usar depois.
   - Sem internet: cai pra última cópia boa que ficou guardada no cache, em vez de dar erro.
   - O version.json NUNCA passa pelo cache aqui — sempre vai direto pra rede (ou falha mesmo
     se não tiver sinal), porque é ele que o próprio app usa pra saber se tem versão nova
     publicada (ver checarNovaVersaoDisponivel no index.html); cachear ele quebraria esse aviso.
*/
const CACHE_NAME = 'inova-cristalina-shell-v1';
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {/* sem internet no 1º acesso — sem problema, guarda no próximo online */})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) => Promise.all(
      nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if(req.method !== 'GET') return;
  if(req.url.includes('version.json')) return; // deixa passar direto pra rede, sem cache

  event.respondWith(
    fetch(req)
      .then((resposta) => {
        if(resposta && resposta.ok){
          const copia = resposta.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copia)).catch(() => {});
        }
        return resposta;
      })
      .catch(() => caches.match(req).then((emCache) => emCache || caches.match('./index.html')))
  );
});
