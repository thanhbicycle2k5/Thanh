self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const payload = event.data?.json?.() || {};
  const title = payload.title || 'Task2Goal reminder';
  const body = payload.body || 'Your plan is coming up.';

  const options = {
    body,
    icon: '/task2goal-icon.svg',
    badge: '/task2goal-icon.svg',
    tag: 'task2goal-reminder',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
