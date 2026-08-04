const APP_SHELL_CACHE = 'scheduly-app-shell-v1';
const SCHEDULE_CACHE_NAME = 'scheduly-notifications-v1';
const SCHEDULY_NOTIFICATION_MESSAGE = 'SCHEDULY_SCHEDULE_NOTIFICATION';
const SCHEDULY_CLEAR_ALL_NOTIFICATIONS = 'SCHEDULY_CLEAR_ALL_NOTIFICATIONS';
const APP_SHELL_URLS = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest'];

async function openScheduleCache() {
  return await caches.open(SCHEDULE_CACHE_NAME);
}

async function openAppShellCache() {
  return await caches.open(APP_SHELL_CACHE);
}

async function storeScheduledPayload(payload) {
  const cache = await openScheduleCache();
  const request = new Request(`/scheduly-notification/${payload.id}`);
  const response = new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });
  await cache.put(request, response);
}

async function readScheduledPayloads() {
  const cache = await openScheduleCache();
  const entries = await cache.keys();
  const results = [];
  for (const request of entries) {
    const response = await cache.match(request);
    if (!response) continue;
    const payload = await response.json();
    results.push({ request, payload });
  }
  return results;
}

async function removeScheduledPayload(request) {
  const cache = await openScheduleCache();
  await cache.delete(request);
}

async function clearScheduledPayloads() {
  const cache = await openScheduleCache();
  const requests = await cache.keys();
  await Promise.all(requests.map((request) => cache.delete(request)));
}

async function closeActiveNotifications() {
  try {
    const notifications = await self.registration.getNotifications();
    notifications.forEach((notification) => notification.close());
  } catch (error) {
    console.warn('Failed to close scheduled notifications', error);
  }
}

function showNotification(payload) {
  return self.registration.showNotification(payload.title, {
    body: payload.body,
    tag: payload.id,
    renotify: false,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: payload,
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await openAppShellCache();
      await cache.addAll(APP_SHELL_URLS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (![APP_SHELL_CACHE, SCHEDULE_CACHE_NAME].includes(cacheName)) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then(async (response) => {
          const cache = await openAppShellCache();
          cache.put(request, response.clone());
          return response;
        });
      }).catch(() => caches.match('/'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then(async (response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const cache = await openAppShellCache();
          cache.put(request, response.clone());
          return response;
        })
        .catch(() => {
          if (request.destination === 'image') {
            return new Response('', { status: 503, statusText: 'Offline' });
          }
          return caches.match('/');
        });
    })
  );
});

self.addEventListener('message', async (event) => {
  const message = event.data;
  if (!message) {
    return;
  }

  if (message.type === SCHEDULY_CLEAR_ALL_NOTIFICATIONS) {
    await clearScheduledPayloads();
    await closeActiveNotifications();
    return;
  }

  if (message.type !== SCHEDULY_NOTIFICATION_MESSAGE) {
    return;
  }

  const payload = message.payload;
  if (!payload || typeof payload.fireAt !== 'number') {
    return;
  }

  await storeScheduledPayload(payload);
  const delay = payload.fireAt - Date.now();
  if (delay <= 0) {
    await showNotification(payload);
    return;
  }

  if ('showTrigger' in Notification.prototype && 'TimestampTrigger' in self) {
    try {
      await self.registration.showNotification(payload.title, {
        body: payload.body,
        tag: payload.id,
        renotify: false,
        showTrigger: new TimestampTrigger(payload.fireAt),
        data: payload,
      });
      return;
    } catch (error) {
      console.warn('showTrigger unsupported or failed', error);
    }
  }

  self.registration.getNotifications({ tag: payload.id }).then(() => {
    setTimeout(async () => {
      await showNotification(payload);
      await triggerStoredNotifications();
    }, Math.max(0, delay));
  });
});

async function triggerStoredNotifications() {
  const items = await readScheduledPayloads();
  const now = Date.now();
  await Promise.all(
    items.map(async ({ request, payload }) => {
      if (payload.fireAt <= now) {
        await showNotification(payload);
        await removeScheduledPayload(request);
      }
    })
  );
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'scheduly-notification-sync') {
    event.waitUntil(triggerStoredNotifications());
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  const payload = event.data.json();
  event.waitUntil(showNotification(payload));
});
