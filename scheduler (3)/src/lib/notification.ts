export type ScheduledNotificationPayload = {
  id: string;
  title: string;
  body: string;
  fireAt: number;
};

const NOTIFICATION_SW_PATH = '/custom-sw.js';
const SCHEDULY_NOTIFICATION_MESSAGE = 'SCHEDULY_SCHEDULE_NOTIFICATION';
const SCHEDULY_CLEAR_ALL_NOTIFICATIONS = 'SCHEDULY_CLEAR_ALL_NOTIFICATIONS';
const DEFAULT_TASK_LABEL = 'công việc';

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
    renotify: false,
  });
}

export async function clearScheduledNotifications(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registration = await getWorkerRegistration();
  if (registration?.active) {
    registration.active.postMessage({ type: SCHEDULY_CLEAR_ALL_NOTIFICATIONS });
  }
}

export async function scheduleTaskNotification(payload: ScheduledNotificationPayload): Promise<void> {
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
    return;
  }

  // Fallback if service worker is not available.
  const delay = payload.fireAt - Date.now();
  if (delay <= 0) {
    showImmediateNotification(payload.title);
    return;
  }

  window.setTimeout(() => {
    showImmediateNotification(payload.title);
  }, delay);
}
