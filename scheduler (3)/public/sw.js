self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const payload = event.data?.json?.() || {};
  const title = payload.title || 'Scheduler reminder';
  const body = payload.body || 'Your plan is coming up.';

  const options = {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'scheduler-reminder',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
