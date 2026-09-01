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
  gymRestEnabled: false,
  gymRestDurationSeconds: 60,
  gymRestSoundEnabled: true,
  gymRestVibrationEnabled: true,
  desktopSidebarEnabled: true,
  desktopFontSize: 'medium',
  desktopKeyboardShortcutsEnabled: true,
};

const keyFor = (key: string, uid?: string | null) => uid ? `${key}_${uid}` : key;

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
    desktopSidebarEnabled: typeof obj.desktopSidebarEnabled === 'boolean' ? obj.desktopSidebarEnabled : defaultSettings.desktopSidebarEnabled,
    desktopFontSize: obj.desktopFontSize === 'small' || obj.desktopFontSize === 'medium' || obj.desktopFontSize === 'large' ? obj.desktopFontSize : defaultSettings.desktopFontSize,
    desktopKeyboardShortcutsEnabled: typeof obj.desktopKeyboardShortcutsEnabled === 'boolean' ? obj.desktopKeyboardShortcutsEnabled : defaultSettings.desktopKeyboardShortcutsEnabled,
  };
};

const normalizePlan = (plan: any): Plan => {
  const now = new Date().toISOString();
  const normalized: Plan = {
    id: String(plan?.id ?? `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`),
    title: typeof plan?.title === 'string' ? plan.title : '',
    date: typeof plan?.date === 'string' ? plan.date : now,
    startHour: typeof plan?.startHour === 'number' ? plan.startHour : 0,
    startMinute: typeof plan?.startMinute === 'number' ? Math.min(59, Math.max(0, plan.startMinute)) : 0,
    duration: typeof plan?.duration === 'number' ? plan.duration : 1,
    color: plan?.color === 'default' || plan?.color === 'green' || plan?.color === 'yellow' || plan?.color === 'gray' || plan?.color === 'red' || plan?.color === 'blue' ? plan.color : 'yellow',
    notes: typeof plan?.notes === 'string' ? plan.notes : undefined,
    applyMode: plan?.applyMode === 'day' || plan?.applyMode === 'week' ? plan.applyMode : 'none',
    applyDays: Array.isArray(plan?.applyDays) ? plan.applyDays : undefined,
    applyWeekInterval: typeof plan?.applyWeekInterval === 'number' ? plan.applyWeekInterval : undefined,
    applyWeekDays: Array.isArray(plan?.applyWeekDays) ? plan.applyWeekDays : undefined,
    applyUntil: typeof plan?.applyUntil === 'string' ? plan.applyUntil : undefined,
    createdAt: typeof plan?.createdAt === 'string' ? plan.createdAt : now,
    updatedAt: typeof plan?.updatedAt === 'string' ? plan.updatedAt : now,
    deviceId: typeof plan?.deviceId === 'string' ? plan.deviceId : undefined,
    syncStatus: plan?.syncStatus === 'pending' || plan?.syncStatus === 'conflict' ? plan.syncStatus : 'synced',
    version: typeof plan?.version === 'number' ? plan.version : 1,
  };
  return normalized;
};

export const storage = {
  getPlans: (uid?: string | null): Plan[] => {
    try {
      const data = localStorage.getItem(keyFor('chronos_excel_plans', uid));
      const parsed = data ? JSON.parse(data) : [];
      return Array.isArray(parsed) ? parsed.map(normalizePlan) : [];
    } catch (e) {
      console.error('Failed to load plans', e);
      return [];
    }
  },
  savePlans: (plans: Plan[], uid?: string | null) => {
    localStorage.setItem(keyFor('chronos_excel_plans', uid), JSON.stringify(plans.map(normalizePlan)));
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
  }
};
