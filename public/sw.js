self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Mantem as requisicoes na rede e evita armazenar dados privados do painel.
self.addEventListener("fetch", () => {});
