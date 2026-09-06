export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  return await Notification.requestPermission();
}

export function showBrowserNotification(title: string, body: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const notification = new Notification(title, {
    body,
    requireInteraction: false,
    tag: 'task2goal-reminder',
  });

  setTimeout(() => notification.close(), 15000);
}

export function scheduleReminderNotification(plan: { id: string; title: string; date: string; startHour: number; reminderMinutes?: number | null }) {
  const reminderMinutes = Number(plan.reminderMinutes ?? 0);
  if (!Number.isFinite(reminderMinutes) || reminderMinutes < 0) return;

  const reminderTime = new Date(plan.date);
  reminderTime.setHours(plan.startHour, 0, 0, 0);
  reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes);

  const delta = reminderTime.getTime() - Date.now();
  if (delta <= 0) {
    showBrowserNotification('Task2Goal', `${plan.title || 'Plan'} is due now.`);
    return;
  }

  const key = `task2goal-reminder-${plan.id}`;
  const existing = window.localStorage.getItem(key);
  const nextValue = String(reminderTime.getTime());

  if (existing === nextValue) return;
  window.localStorage.setItem(key, nextValue);

  window.setTimeout(() => {
    showBrowserNotification('Task2Goal reminder', `${plan.title || 'Plan'} starts at ${plan.startHour}:00.`);
    window.localStorage.removeItem(key);
  }, delta);
}

export function syncReminderNotifications(plans: Array<{ id: string; title: string; date: string; startHour: number; reminderMinutes?: number | null }>) {
  const now = Date.now();

  for (const plan of plans) {
    const reminderMinutes = Number(plan.reminderMinutes ?? 0);
    if (!Number.isFinite(reminderMinutes) || reminderMinutes <= 0) continue;

    const reminderTime = new Date(plan.date);
    reminderTime.setHours(plan.startHour, 0, 0, 0);
    reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes);

    if (reminderTime.getTime() > now) {
      scheduleReminderNotification(plan);
    }
  }
}
