const SCHEDULE_CACHE_NAME = 'scheduly-notifications-v1';
const SCHEDULY_NOTIFICATION_MESSAGE = 'SCHEDULY_SCHEDULE_NOTIFICATION';

async function openScheduleCache() {
  return await caches.open(SCHEDULE_CACHE_NAME);
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

function showNotification(payload) {
  return self.registration.showNotification(payload.title, {
    body: payload.body,
    tag: payload.id,
    renotify: false,
    data: payload,
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', async (event) => {
  const message = event.data;
  if (!message || message.type !== SCHEDULY_NOTIFICATION_MESSAGE) {
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
