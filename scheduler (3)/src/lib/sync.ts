import { Plan } from '../types';

export type SyncOperationType = 'create' | 'update' | 'delete';

export interface SyncQueueItem {
  id: string;
  uid: string | null;
  planId: string;
  type: SyncOperationType;
  plan?: Plan;
  timestamp: string;
  updatedAt: string;
  deviceId: string;
}

const SYNC_QUEUE_KEY = 'scheduler_sync_queue_v1';
const DEVICE_ID_KEY = 'scheduler_device_id_v1';

export const getDeviceId = (): string => {
  try {
    const storage = window.localStorage;
    const existing = storage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    storage.setItem(DEVICE_ID_KEY, next);
    return next;
  } catch {
    return 'device-fallback';
  }
};

export const normalizePlanForStorage = (plan: Partial<Plan>): Plan => {
  const now = new Date().toISOString();
  const safeDate = plan.date || now;
  const next: Plan = {
    id: plan.id || `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: plan.title || '',
    date: safeDate,
    startHour: typeof plan.startHour === 'number' ? plan.startHour : 0,
    duration: typeof plan.duration === 'number' ? plan.duration : 1,
    color: plan.color || 'yellow',
    notes: plan.notes || undefined,
    reminderMinutes: typeof plan.reminderMinutes === 'number' ? plan.reminderMinutes : 0,
    applyMode: plan.applyMode || 'none',
    applyDays: plan.applyDays || undefined,
    applyWeekInterval: plan.applyWeekInterval || undefined,
    applyWeekDays: plan.applyWeekDays || undefined,
    applyUntil: plan.applyUntil || undefined,
    createdAt: plan.createdAt || now,
    updatedAt: plan.updatedAt || now,
    deviceId: plan.deviceId || getDeviceId(),
    syncStatus: plan.syncStatus || 'pending',
    version: typeof plan.version === 'number' ? plan.version : 1,
  };

  return next;
};

export const markPlanForSync = (plan: Partial<Plan>): Plan => {
  const now = new Date().toISOString();
  const normalized = normalizePlanForStorage(plan);
  const createdAt = normalized.createdAt || now;
  const version = (typeof normalized.version === 'number' ? normalized.version : 0) + 1;

  return {
    ...normalized,
    createdAt,
    updatedAt: now,
    deviceId: normalized.deviceId || getDeviceId(),
    syncStatus: 'pending',
    version,
  };
};

export const getSyncQueue = (): SyncQueueItem[] => {
  try {
    const raw = window.localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveSyncQueue = (queue: SyncQueueItem[]) => {
  window.localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
};

export const enqueueSyncOperation = (uid: string | null, type: SyncOperationType, plan?: Plan, planIdOverride?: string): void => {
  const queue = getSyncQueue();
  const planId = planIdOverride || plan?.id || `queued-${Date.now()}`;
  const timestamp = new Date().toISOString();
  const item: SyncQueueItem = {
    id: `${planId}-${timestamp}-${Math.random().toString(16).slice(2)}`,
    uid,
    planId,
    type,
    plan: plan ? markPlanForSync(plan) : undefined,
    timestamp,
    updatedAt: timestamp,
    deviceId: getDeviceId(),
  };

  const filtered = queue.filter((entry) => !(entry.uid === uid && entry.planId === planId && entry.type === type));
  filtered.push(item);
  saveSyncQueue(filtered);
};

export const clearQueuedOperation = (uid: string | null, planId: string): void => {
  const queue = getSyncQueue().filter((entry) => !(entry.uid === uid && entry.planId === planId));
  saveSyncQueue(queue);
};

export const mergePlans = (localPlans: Plan[], remotePlans: Plan[]): Plan[] => {
  const merged = new Map<string, Plan>();

  [...localPlans, ...remotePlans].forEach((plan) => {
    const current = merged.get(plan.id);
    if (!current) {
      merged.set(plan.id, normalizePlanForStorage(plan));
      return;
    }

    const currentUpdated = new Date(current.updatedAt || current.createdAt || 0).getTime();
    const incomingUpdated = new Date(plan.updatedAt || plan.createdAt || 0).getTime();
    const winner = incomingUpdated > currentUpdated ? plan : current;
    merged.set(plan.id, normalizePlanForStorage(winner));
  });

  return Array.from(merged.values()).sort((a, b) => {
    const left = new Date(a.date).getTime();
    const right = new Date(b.date).getTime();
    return left - right;
  });
};

export const getReminderNotificationTime = (plan: Plan): Date | null => {
  if (!plan || typeof plan.startHour !== 'number') return null;
  const reminderMinutes = Number(plan.reminderMinutes ?? 0);
  if (!Number.isFinite(reminderMinutes) || reminderMinutes <= 0) return null;

  const date = new Date(plan.date);
  date.setHours(plan.startHour, 0, 0, 0);
  date.setMinutes(date.getMinutes() - reminderMinutes);
  return date;
};

export const isPlanReminderDue = (plan: Plan): boolean => {
  const notifyAt = getReminderNotificationTime(plan);
  if (!notifyAt) return false;
  return notifyAt.getTime() <= Date.now();
};

export const flushSyncQueue = async (
  uid: string,
  savePlan: (plan: Plan) => Promise<void>,
  deletePlan: (id: string) => Promise<void>,
): Promise<void> => {
  const queue = getSyncQueue().filter((entry) => entry.uid === uid);
  if (!queue.length) return;

  const remaining: SyncQueueItem[] = [];

  for (const entry of queue) {
    try {
      if (entry.type === 'delete') {
        await deletePlan(entry.planId);
        continue;
      }
      if (entry.plan) {
        await savePlan(markPlanForSync(entry.plan));
      }
    } catch {
      remaining.push(entry);
    }
  }

  saveSyncQueue(remaining.filter((entry) => entry.uid === uid));
};
