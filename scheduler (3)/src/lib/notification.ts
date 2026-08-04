export type ScheduledNotificationPayload = {
  id: string;
  title: string;
  body: string;
  fireAt: number;
};

const NOTIFICATION_SW_PATH = '/custom-sw.js';
const SCHEDULY_NOTIFICATION_MESSAGE = 'SCHEDULY_SCHEDULE_NOTIFICATION';
const SCHEDULY_CLEAR_ALL_NOTIFICATIONS = 'SCHEDULY_CLEAR_ALL_NOTIFICATIONS';
const SCHEDULY_CANCEL_NOTIFICATION = 'SCHEDULY_CANCEL_NOTIFICATION';
const DEFAULT_TASK_LABEL = 'công việc';

const fallbackTimeouts = new Map<string, number>();

const normalizeTaskName = (taskName: string) => taskName?.trim() || DEFAULT_TASK_LABEL;

export const buildNotificationTitle = () => '🐱 Scheduly nhắc nhở nè!';
export const buildNotificationBody = (taskName: string) => {
  const label = normalizeTaskName(taskName);
  return `Đến giờ thực hiện nhiệm vụ "${label}" rồi, bắt đầu cùng Scheduly thôi!`;
};

export async function requestUniversalNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    if ('permissions' in navigator) {
      const status = await (navigator as any).permissions.query({ name: 'notifications' });
      if (status.state === 'denied') {
        return 'denied';
      }
    }
  } catch {
    // Some browsers do not support permissions.query for notifications.
  }

  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

export async function registerNotificationWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(NOTIFICATION_SW_PATH);
    // If a new SW is waiting, ask it to skip waiting so the client can be controlled by the new SW.
    if (registration.waiting) {
      try {
        registration.waiting.postMessage({ type: 'SCHEDULY_SKIP_WAITING' });
      } catch (e) {}
    }

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          try { newWorker.postMessage({ type: 'SCHEDULY_SKIP_WAITING' }); } catch (e) {}
        }
      });
    });

    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.warn('Service worker registration failed:', error);
    return null;
  }
}

function getWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }

  return navigator.serviceWorker.ready.catch(() => null);
}

export function showImmediateNotification(taskName: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }
  if (Notification.permission !== 'granted') {
    return;
  }

  new Notification(buildNotificationTitle(), {
    body: buildNotificationBody(taskName),
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: `scheduly-${taskName}-${Date.now()}`,
  });
}

export async function clearScheduledNotifications(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  fallbackTimeouts.forEach((timeoutId) => {
    window.clearTimeout(timeoutId);
  });
  fallbackTimeouts.clear();

  const registration = await getWorkerRegistration();
  if (registration?.active) {
    registration.active.postMessage({ type: SCHEDULY_CLEAR_ALL_NOTIFICATIONS });
  }
}

export async function cancelScheduledNotificationById(id: string): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const timeoutId = fallbackTimeouts.get(id);
  if (timeoutId !== undefined) {
    window.clearTimeout(timeoutId);
    fallbackTimeouts.delete(id);
  }

  const registration = await getWorkerRegistration();
  if (registration?.active) {
    registration.active.postMessage({ type: SCHEDULY_CANCEL_NOTIFICATION, payload: { id } });
  }
}

export async function showNowNotification(title: string, body: string, tag?: string): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  const permission = await requestUniversalNotificationPermission();
  if (permission !== 'granted') return;

  try {
    const registration = await getWorkerRegistration();
    if (registration?.showNotification) {
      // Use the service worker to show the notification so it can appear when app is backgrounded
      registration.showNotification(title, {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: tag ?? `scheduly-${Date.now()}`,
      });
      return;
    }
  } catch (e) {
    // ignore and fallback to window Notification
  }

  // Fallback to in-page Notification
  try {
    new Notification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: tag ?? `scheduly-${Date.now()}`,
    });
  } catch (e) {
    console.warn('showNowNotification failed', e);
  }
}

export async function scheduleTaskNotification(payload: ScheduledNotificationPayload): Promise<number | null> {
  const permission = await requestUniversalNotificationPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission not granted.');
  }

  const registration = await getWorkerRegistration();
  if (registration?.active) {
    registration.active.postMessage({
      type: SCHEDULY_NOTIFICATION_MESSAGE,
      payload,
    });
    return null;
  }

  // Fallback if service worker is not available.
  const delay = payload.fireAt - Date.now();
  if (delay <= 0) {
    return null;
  }

  const timeoutId = window.setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification(payload.title, {
        body: payload.body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: payload.id,
      });
    }
    fallbackTimeouts.delete(payload.id);
  }, delay);
  fallbackTimeouts.set(payload.id, timeoutId);
  return timeoutId;
}
