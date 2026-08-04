import { Plan, AppSettings } from '../types';

const defaultSettings: AppSettings = {
  language: 'en',
  theme: 'light',
  musicEnabled: false,
  musicVolume: 0.3,
  musicTrackId: 'lofi1',
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
};

const keyFor = (key: string, uid?: string | null) => uid ? `${key}_${uid}` : key;
const pendingSyncKey = (uid?: string | null) => keyFor('chronos_pending_sync', uid);

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
  };
};

const FIRED_NOTIFICATION_IDS_KEY = 'chronos_fired_notification_ids';

export const storage = {
  getPlans: (uid?: string | null): Plan[] => {
    try {
      const data = localStorage.getItem(keyFor('chronos_excel_plans', uid));
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load plans', e);
      return [];
    }
  },
  savePlans: (plans: Plan[], uid?: string | null) => {
    localStorage.setItem(keyFor('chronos_excel_plans', uid), JSON.stringify(plans));
    if (uid) {
      localStorage.setItem(pendingSyncKey(uid), '1');
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
  saveWeekMeta: (weekStart: string, meta: any, uid?: string | null) => {
    const metas = storage.getWeekMetas(uid);
    metas[weekStart] = { ...metas[weekStart], ...meta };
    localStorage.setItem(keyFor('chronos_week_meta', uid), JSON.stringify(metas));
    if (uid) {
      localStorage.setItem(pendingSyncKey(uid), '1');
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
  saveSettings: (settings: Partial<AppSettings>, uid?: string | null) => {
    const current = storage.getSettings(uid);
    const normalized = normalizeSettings({ ...current, ...settings });
    localStorage.setItem(keyFor('chronos_settings', uid), JSON.stringify(normalized));
    if (uid) {
      localStorage.setItem(pendingSyncKey(uid), '1');
    }
  },
  addPlan: (plan: Plan, uid?: string | null) => {
    const plans = storage.getPlans(uid);
    storage.savePlans([...plans, plan], uid);
  },
  updatePlan: (updatedPlan: Plan, uid?: string | null) => {
    const plans = storage.getPlans(uid);
    storage.savePlans(plans.map(p => p.id === updatedPlan.id ? updatedPlan : p), uid);
  },
  deletePlan: (id: string, uid?: string | null) => {
    const plans = storage.getPlans(uid);
    storage.savePlans(plans.filter(p => p.id !== id), uid);
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
    return localStorage.getItem(pendingSyncKey(uid)) === '1';
  },
  clearPendingSync: (uid?: string | null) => {
    if (!uid) {
      return;
    }
    localStorage.removeItem(pendingSyncKey(uid));
  },
  clearFiredNotificationIds: (uid?: string | null) => {
    localStorage.removeItem(keyFor(FIRED_NOTIFICATION_IDS_KEY, uid));
  }
};
