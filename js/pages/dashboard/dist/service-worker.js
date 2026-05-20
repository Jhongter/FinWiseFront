// ============================================================
// service-worker.js — FinWise PWA
// Coloque na raiz do projeto (ou em dist/)
// ============================================================

const CACHE_NAME = "finwise-v1";
const CACHE_ASSETS = [
  "./dashboard.html",
  "./dashboard-style.css",
  "./dashboard.js",
  "./desafio-grupo.html",
  "./cotacoes.html",
  "./educacao-financeira.html",
  "./jogos.html",
  "./finwise-kids.html",
  "./carteira-ficticia.html",
  "./controle-dividas.html",
  "./regra-50-30-20.html",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css",
];

// ── Instalação: pré-cacheia os assets principais ──
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_ASSETS))
  );
  self.skipWaiting();
});

// ── Ativação: limpa caches antigos ──
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: estratégia Network-first, fallback para cache ──
self.addEventListener("fetch", event => {
  // Ignora requests que não são GET
  if (event.request.method !== "GET") return;

  // Ignora extensões do Chrome e requests de outros origins
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Atualiza cache com resposta fresca
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Notificações Push ──
self.addEventListener("push", event => {
  const data = event.data?.json() ?? {};

  const title = data.title || "FinWise 🔥";
  const options = {
    body: data.body || "Você fez seu check-in hoje?",
    icon: data.icon || "./icon-192.png",
    badge: "./icon-96.png",
    tag: data.tag || "finwise-push",
    renotify: true,
    data: { url: data.url || "./desafio-grupo.html" },
    actions: [
      { action: "checkin", title: "✅ Fazer check-in" },
      { action: "dismiss", title: "Depois" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Clique na notificação ──
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "./desafio-grupo.html";

  if (event.action === "checkin") {
    // Abre a página do desafio e faz check-in automático
    event.waitUntil(
      clients.matchAll({ type: "window" }).then(clientList => {
        for (const client of clientList) {
          if (client.url.includes("desafio-grupo") && "focus" in client) {
            client.focus();
            client.postMessage({ type: "AUTO_CHECKIN" });
            return;
          }
        }
        clients.openWindow(url + "?auto_checkin=1");
      })
    );
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: "window" }).then(clientList => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      clients.openWindow(url);
    })
  );
});

// ── Sync em background (quando volta online) ──
self.addEventListener("sync", event => {
  if (event.tag === "finwise-sync") {
    event.waitUntil(
      // Manda mensagem para as abas abertas processarem a fila
      clients.matchAll().then(clientList => {
        clientList.forEach(client => client.postMessage({ type: "SYNC_QUEUE" }));
      })
    );
  }
});