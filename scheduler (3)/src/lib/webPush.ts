import type { Plan } from '../types';

type DeviceCredentials = { deviceId: string; deviceToken: string };
type PushReminder = { id: string; taskId: string; title: string; body: string; fireAt: number };

const DEVICE_KEY = 'task2goal-push-device';

function getCredentials(): DeviceCredentials {
  const stored = window.localStorage.getItem(DEVICE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as DeviceCredentials;
      if (parsed.deviceId && parsed.deviceToken) return parsed;
    } catch {
      // Regenerate invalid local credentials.
    }
  }
  const credentials = { deviceId: crypto.randomUUID(), deviceToken: `${crypto.randomUUID()}${crypto.randomUUID()}` };
  window.localStorage.setItem(DEVICE_KEY, JSON.stringify(credentials));
  return credentials;
}

async function apiRequest(path: string, init: RequestInit = {}) {
  const credentials = getCredentials();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('X-Device-Id', credentials.deviceId);
  headers.set('X-Device-Token', credentials.deviceToken);
  const response = await fetch(path, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(payload.error || `Push request failed (${response.status}).`));
  return payload;
}

function decodeVapidKey(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}

async function subscribeWithRegistration(registration: ServiceWorkerRegistration, publicKey: string): Promise<PushSubscription> {
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeVapidKey(publicKey),
    });
  }
  await apiRequest('/api/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription: subscription.toJSON() }) });
  return subscription;
}

export async function subscribeToWebPush(registration: ServiceWorkerRegistration): Promise<PushSubscription> {
  if (!('PushManager' in window)) throw new Error('This browser does not support Web Push.');
  const { publicKey } = await apiRequest('/api/push/config', { method: 'GET' });
  if (!publicKey) throw new Error('Web Push is not configured on the server.');

  try {
    return await subscribeWithRegistration(registration, publicKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('Registration failed - push service error')) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((existing) => existing.unregister().catch(() => undefined)));
      } catch (unregisterError) {
        console.warn('Failed to unregister stale push registration', unregisterError);
      }
      const refreshedRegistration = await navigator.serviceWorker.register('/custom-sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      return await subscribeWithRegistration(refreshedRegistration, publicKey);
    }
    throw error;
  }
}

export async function syncWebPushReminders(reminders: PushReminder[]): Promise<void> {
  await apiRequest('/api/push/reminders', { method: 'PUT', body: JSON.stringify({ reminders }) });
}

export async function sendWebPushTest(): Promise<void> {
  await apiRequest('/api/push/test', { method: 'POST', body: '{}' });
}

export function buildRemoteReminders(plans: Plan[], title: (plan: Plan) => string, body: (plan: Plan) => string, getFireAt: (plan: Plan) => number): PushReminder[] {
  const now = Date.now();
  return plans
    .filter((plan) => plan.color !== 'green' && getFireAt(plan) > now)
    .map((plan) => ({ id: `task2goal-${plan.id}-${getFireAt(plan)}`, taskId: plan.id, title: title(plan), body: body(plan), fireAt: getFireAt(plan) }));
}