import { Plan, AppSettings } from '../types';

const defaultSettings: AppSettings = {
  language: 'en',
  theme: 'light',
  musicEnabled: false,
  musicVolume: 0.3,
  musicTrackId: 'lofi1',
  musicPlaybackMode: 'loop_all',
  customMusicDataUrl: '',
  customMusicName: '',
  notificationsEnabled: false,
  notificationSound: 'bird',
  startHour: 7,
  endHour: 22,
  catColor: 'orange',
  gymRestEnabled: false,
  gymRestDurationSeconds: 60,
  gymRestSoundEnabled: true,
  gymRestVibrationEnabled: true,
  showLunarCalendar: true,
  desktopSidebarEnabled: true,
  desktopFontSize: 'medium',
  desktopKeyboardShortcutsEnabled: true,
  weekTransitionEffect: 'slide',
};

type PendingSyncScope = 'plans' | 'week_meta' | 'settings';
const PLANS_KEY = 'chronos_excel_plans';
const DELETED_PLANS_KEY = 'chronos_deleted_plans';
const keyFor = (key: string, uid?: string | null) => uid ? `${key}_${uid}` : key;
const pendingSyncKey = (uid?: string | null, scope?: PendingSyncScope) => {
  const base = 'chronos_pending_sync';
  return scope ? keyFor(`${base}_${scope}`, uid) : keyFor(base, uid);
};
const themeKey = 'chronos_theme';

export type DeletedPlanRecord = {
  id: string;
  deletedAt: string;
  isSynced: boolean;
};

const nowIso = () => new Date().toISOString();

const isBackgroundConfig = (value: any): value is AppSettings['backgroundConfig'] => {
  return (
    value &&
    typeof value === 'object' &&
    (value.type === 'color' || value.type === 'gradient' || value.type === 'image') &&
    typeof value.value === 'string' &&
    (value.opacity === undefined || typeof value.opacity === 'number')
  );
};

export const normalizeSettings = (raw: any): AppSettings => {
  const obj = raw && typeof raw === 'object' ? raw : {};

  return {
    language: obj.language === 'vi' ? 'vi' : 'en',
    theme: obj.theme === 'dark' ? 'dark' : 'light',
    musicEnabled: typeof obj.musicEnabled === 'boolean' ? obj.musicEnabled : defaultSettings.musicEnabled,
    musicVolume: typeof obj.musicVolume === 'number' && !Number.isNaN(obj.musicVolume) ? obj.musicVolume : defaultSettings.musicVolume,
    musicTrackId: typeof obj.musicTrackId === 'string' ? obj.musicTrackId : defaultSettings.musicTrackId,
    musicPlaybackMode: obj.musicPlaybackMode === 'play_once' || obj.musicPlaybackMode === 'loop_one' || obj.musicPlaybackMode === 'loop_all' || obj.musicPlaybackMode === 'shuffle' ? obj.musicPlaybackMode : defaultSettings.musicPlaybackMode,
    customMusicDataUrl: typeof obj.customMusicDataUrl === 'string' ? obj.customMusicDataUrl : defaultSettings.customMusicDataUrl,
    customMusicName: typeof obj.customMusicName === 'string' ? obj.customMusicName : defaultSettings.customMusicName,
    notificationsEnabled: typeof obj.notificationsEnabled === 'boolean' ? obj.notificationsEnabled : defaultSettings.notificationsEnabled,
    notificationSound: obj.notificationSound === 'bird' || obj.notificationSound === 'wind' || obj.notificationSound === 'bell' || obj.notificationSound === 'chime' ? obj.notificationSound : defaultSettings.notificationSound,
    startHour: typeof obj.startHour === 'number' && Number.isInteger(obj.startHour) ? obj.startHour : defaultSettings.startHour,
    endHour: typeof obj.endHour === 'number' && Number.isInteger(obj.endHour) ? obj.endHour : defaultSettings.endHour,
    backgroundConfig: isBackgroundConfig(obj.backgroundConfig) ? obj.backgroundConfig : undefined,
    catEnabled: typeof obj.catEnabled === 'boolean' ? obj.catEnabled : true,
    gymRestEnabled: typeof obj.gymRestEnabled === 'boolean' ? obj.gymRestEnabled : defaultSettings.gymRestEnabled,
    gymRestDurationSeconds: typeof obj.gymRestDurationSeconds === 'number' && Number.isInteger(obj.gymRestDurationSeconds) ? obj.gymRestDurationSeconds : defaultSettings.gymRestDurationSeconds,
    gymRestSoundEnabled: typeof obj.gymRestSoundEnabled === 'boolean' ? obj.gymRestSoundEnabled : defaultSettings.gymRestSoundEnabled,
    gymRestVibrationEnabled: typeof obj.gymRestVibrationEnabled === 'boolean' ? obj.gymRestVibrationEnabled : defaultSettings.gymRestVibrationEnabled,
    showLunarCalendar: typeof obj.showLunarCalendar === 'boolean' ? obj.showLunarCalendar : defaultSettings.showLunarCalendar,
    desktopSidebarEnabled: typeof obj.desktopSidebarEnabled === 'boolean' ? obj.desktopSidebarEnabled : defaultSettings.desktopSidebarEnabled,
    desktopFontSize: obj.desktopFontSize === 'small' || obj.desktopFontSize === 'medium' || obj.desktopFontSize === 'large' ? obj.desktopFontSize : defaultSettings.desktopFontSize,
    desktopKeyboardShortcutsEnabled: typeof obj.desktopKeyboardShortcutsEnabled === 'boolean' ? obj.desktopKeyboardShortcutsEnabled : defaultSettings.desktopKeyboardShortcutsEnabled,
    catColor: obj.catColor === 'orange' || obj.catColor === 'pink' || obj.catColor === 'blue' || obj.catColor === 'green' || obj.catColor === 'purple' || obj.catColor === 'yellow' || obj.catColor === 'teal' || obj.catColor === 'red' || obj.catColor === 'gray' || obj.catColor === 'black' || obj.catColor === 'white' ? obj.catColor : defaultSettings.catColor,
    weekTransitionEffect: obj.weekTransitionEffect === 'none' || obj.weekTransitionEffect === 'fade' || obj.weekTransitionEffect === 'slide' ? obj.weekTransitionEffect : defaultSettings.weekTransitionEffect,
  };
};

const FIRED_NOTIFICATION_IDS_KEY = 'chronos_fired_notification_ids';

export const storage = {
  getPlans: (uid?: string | null): Plan[] => {
    try {
      const data = localStorage.getItem(keyFor(PLANS_KEY, uid));
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load plans', e);
      return [];
    }
  },
  setPendingSync: (uid: string, scope: PendingSyncScope, pending: boolean) => {
    if (!uid) return;
    if (pending) {
      localStorage.setItem(pendingSyncKey(uid, scope), '1');
    } else {
      localStorage.removeItem(pendingSyncKey(uid, scope));
    }
  },
  hasPendingSyncFor: (uid: string | null | undefined, scope: PendingSyncScope) => {
    if (!uid) return false;
    return localStorage.getItem(pendingSyncKey(uid, scope)) === '1';
  },
  savePlans: (plans: Plan[], uid?: string | null, markPending = true) => {
    const stamped = plans.map((plan) => ({
      ...plan,
      updatedAt: plan.updatedAt ?? nowIso(),
      isSynced: plan.isSynced ?? !markPending,
    }));
    localStorage.setItem(keyFor(PLANS_KEY, uid), JSON.stringify(stamped));
    if (uid && markPending) {
      localStorage.setItem(pendingSyncKey(uid, 'plans'), '1');
    }
  },
  getDeletedPlans: (uid?: string | null): DeletedPlanRecord[] => {
    try {
      const data = localStorage.getItem(keyFor(DELETED_PLANS_KEY, uid));
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load deleted plans', e);
      return [];
    }
  },
  saveDeletedPlans: (deletedPlans: DeletedPlanRecord[], uid?: string | null, markPending = true) => {
    const stamped = deletedPlans.map((deletedPlan) => ({
      ...deletedPlan,
      isSynced: deletedPlan.isSynced ?? !markPending,
    }));
    localStorage.setItem(keyFor(DELETED_PLANS_KEY, uid), JSON.stringify(stamped));
    if (uid && markPending) {
      localStorage.setItem(pendingSyncKey(uid, 'plans'), '1');
    }
  },
  getWeekMetas: (uid?: string | null): Record<string, any> => {
    try {
      const data = localStorage.getItem(keyFor('chronos_week_meta', uid));
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },
  saveWeekMeta: (weekStart: string, meta: any, uid?: string | null, markPending = true) => {
    const metas = storage.getWeekMetas(uid);
    metas[weekStart] = { ...metas[weekStart], ...meta };
    localStorage.setItem(keyFor('chronos_week_meta', uid), JSON.stringify(metas));
    if (uid && markPending) {
      localStorage.setItem(pendingSyncKey(uid, 'week_meta'), '1');
    }
  },
  getSettings: (uid?: string | null): AppSettings => {
    try {
      const data = localStorage.getItem(keyFor('chronos_settings', uid));
      const parsed = data ? JSON.parse(data) : {};
      return normalizeSettings({ ...defaultSettings, ...parsed });
    } catch (e) {
      return defaultSettings;
    }
  },
  hasStoredSettings: (uid?: string | null) => {
    return localStorage.getItem(keyFor('chronos_settings', uid)) !== null;
  },
  saveSettings: (settings: Partial<AppSettings>, uid?: string | null, markPending = true) => {
    const current = storage.getSettings(uid);
    const normalized = normalizeSettings({ ...current, ...settings });
    localStorage.setItem(keyFor('chronos_settings', uid), JSON.stringify(normalized));
    localStorage.setItem(themeKey, normalized.theme);
    if (uid && markPending) {
      localStorage.setItem(pendingSyncKey(uid, 'settings'), '1');
    }
  },
  addPlan: (plan: Plan, uid?: string | null) => {
    const plans = storage.getPlans(uid);
    storage.savePlans([
      ...plans,
      {
        ...plan,
        updatedAt: nowIso(),
        isSynced: false,
      },
    ], uid);
  },
  updatePlan: (updatedPlan: Plan, uid?: string | null) => {
    const plans = storage.getPlans(uid);
    storage.savePlans(plans.map((p) => p.id === updatedPlan.id ? {
      ...updatedPlan,
      updatedAt: nowIso(),
      isSynced: false,
    } : p), uid);
  },
  deletePlan: (id: string, uid?: string | null) => {
    const plans = storage.getPlans(uid);
    const deletedAt = nowIso();
    const deletedPlans = storage.getDeletedPlans(uid);
    storage.savePlans(plans.filter((p) => p.id !== id), uid);
    storage.saveDeletedPlans([
      ...deletedPlans.filter((d) => d.id !== id),
      { id, deletedAt, isSynced: false },
    ], uid);
  },
  markPlansSynced: (planIds: string[], uid?: string | null) => {
    const plans = storage.getPlans(uid);
    storage.savePlans(plans.map((plan) => planIds.includes(plan.id) ? { ...plan, isSynced: true } : plan), uid, false);
  },
  clearSyncedDeletedPlans: (uid?: string | null, force = false) => {
    const deletedPlans = storage.getDeletedPlans(uid);
    const remaining = force ? [] : deletedPlans.filter((d) => !d.isSynced);
    storage.saveDeletedPlans(remaining, uid, false);
  },
  getFiredNotificationIds: (uid?: string | null): string[] => {
    try {
      const data = localStorage.getItem(keyFor(FIRED_NOTIFICATION_IDS_KEY, uid));
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load fired notification ids', e);
      return [];
    }
  },
  addFiredNotificationId: (notificationId: string, uid?: string | null) => {
    const ids = storage.getFiredNotificationIds(uid);
    if (!ids.includes(notificationId)) {
      ids.push(notificationId);
      localStorage.setItem(keyFor(FIRED_NOTIFICATION_IDS_KEY, uid), JSON.stringify(ids));
    }
  },
  hasPendingSync: (uid?: string | null) => {
    if (!uid) {
      return false;
    }
    return (
      localStorage.getItem(pendingSyncKey(uid, 'plans')) === '1' ||
      localStorage.getItem(pendingSyncKey(uid, 'week_meta')) === '1' ||
      localStorage.getItem(pendingSyncKey(uid, 'settings')) === '1'
    );
  },
  clearPendingSync: (uid?: string | null, scope?: PendingSyncScope) => {
    if (!uid) {
      return;
    }
    if (scope) {
      localStorage.removeItem(pendingSyncKey(uid, scope));
      return;
    }
    localStorage.removeItem(pendingSyncKey(uid, 'plans'));
    localStorage.removeItem(pendingSyncKey(uid, 'week_meta'));
    localStorage.removeItem(pendingSyncKey(uid, 'settings'));
  },
  clearFiredNotificationIds: (uid?: string | null) => {
    localStorage.removeItem(keyFor(FIRED_NOTIFICATION_IDS_KEY, uid));
  }
};
