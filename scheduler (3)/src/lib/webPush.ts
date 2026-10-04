import { httpsCallable } from 'firebase/functions';
import type { Plan } from '../types';
import { functions } from './firebase';
import { getLocalDateKey, isPlanOnLocalDate } from './streak';

type PushReminder = {
  id: string;
  taskId: string;
  title: string;
  body: string;
  fireAt: number;
  expiresAt: number;
  taskDate: string;
  timeZoneOffsetMinutes: number;
};

const getPushConfig = httpsCallable<Record<string, never>, { publicKey: string }>(functions, 'getPushConfig');
const savePushSubscription = httpsCallable<{ subscription: PushSubscriptionJSON }, void>(functions, 'savePushSubscription');
const removePushSubscription = httpsCallable<{ endpoint: string }, void>(functions, 'removePushSubscription');
const syncReminderList = httpsCallable<{ reminders: PushReminder[] }, void>(functions, 'syncPushReminders');
const sendTestPush = httpsCallable<Record<string, never>, void>(functions, 'sendPushTest');

function decodeVapidKey(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}

async function subscribeWithRegistration(
  registration: ServiceWorkerRegistration,
  publicKey: string
): Promise<PushSubscription> {
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeVapidKey(publicKey),
    });
  }

  await savePushSubscription({ subscription: subscription.toJSON() });
  return subscription;
}

export async function subscribeToWebPush(registration: ServiceWorkerRegistration): Promise<PushSubscription> {
  if (!('PushManager' in window)) {
    throw new Error('This browser does not support background push notifications.');
  }

  const { data } = await getPushConfig({});
  if (!data.publicKey) {
    throw new Error('Web Push is not configured on the server.');
  }

  return subscribeWithRegistration(registration, data.publicKey);
}

export async function unsubscribeFromWebPush(registration?: ServiceWorkerRegistration | null): Promise<void> {
  const activeRegistration = registration ?? await navigator.serviceWorker.getRegistration('/');
  const subscription = await activeRegistration?.pushManager.getSubscription();
  if (subscription) {
    await removePushSubscription({ endpoint: subscription.endpoint });
    await subscription.unsubscribe();
  }
}

export async function syncWebPushReminders(reminders: PushReminder[]): Promise<void> {
  await syncReminderList({ reminders });
}

export async function sendWebPushTest(): Promise<void> {
  await sendTestPush({});
}

export function buildRemoteReminders(
  plans: Plan[],
  title: (plan: Plan) => string,
  body: (plan: Plan) => string,
  getFireAt: (plan: Plan) => number
): PushReminder[] {
  const now = new Date();
  const nowMs = now.getTime();
  const taskDate = getLocalDateKey(now);
  const timeZoneOffsetMinutes = now.getTimezoneOffset();

  return plans.flatMap((plan) => {
    if (plan.color === 'green' || !isPlanOnLocalDate(plan.date, now)) return [];

    const fireAt = getFireAt(plan);
    const expiresAt = fireAt + (15 * 60_000);
    if (fireAt <= nowMs || expiresAt <= nowMs) return [];

    return [{
      id: `task2goal-${plan.id}-${fireAt}`,
      taskId: plan.id,
      title: title(plan),
      body: body(plan),
      fireAt,
      expiresAt,
      taskDate,
      timeZoneOffsetMinutes,
    }];
  });
}
