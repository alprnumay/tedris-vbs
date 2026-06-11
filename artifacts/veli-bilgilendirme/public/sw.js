const CACHE_NAME = "nehari-veli-bilgilendirme-v3";

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.svg",
];

const OFFLINE_RESPONSE = new Response("Offline", {
  status: 503,
  statusText: "Service Unavailable",
  headers: { "Content-Type": "text/plain; charset=utf-8" },
});

function offlineFallback() {
  return caches.match("/").then((cached) => cached || OFFLINE_RESPONSE);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("push", (event) => {
  const fallback = {
    title: "Günlük takip hatırlatması",
    body: "Bugünkü işler tamamlandı mı? Yoklama, okul ödevi takibi ve veli bilgilendirme durumunu kontrol etmeyi unutmayın.",
    url: "/davet/okul-takip",
  };

  let payload = fallback;
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = { ...fallback, ...parsed };
    }
  } catch {
    /* use fallback */
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "tedris-daily-reminder",
      data: { url: payload.url || "/davet/okul-takip" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/davet/okul-takip";
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if ("navigate" in client && typeof client.navigate === "function") {
            return client.navigate(absoluteUrl).then(() => client.focus());
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteUrl);
      }
      return undefined;
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;

  const isHtml = event.request.headers.get("accept")?.includes("text/html");

  if (isHtml) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type !== "opaque") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || offlineFallback()),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type !== "opaque") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => OFFLINE_RESPONSE);
    }),
  );
});
