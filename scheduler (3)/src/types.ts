export type PlanColor = 'default' | 'green' | 'yellow' | 'gray' | 'red' | 'blue';
export type TaskApplyMode = 'none' | 'day' | 'week';

export interface Plan {
  id: string;
  title: string;
  date: string;
  startHour: number;
  duration: number;
  color: PlanColor;
  notes?: string;
  applyMode?: TaskApplyMode;
  applyDays?: ('mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun')[];
  applyWeekInterval?: number; // repeat every N weeks when applyMode === 'week'
  applyWeekDays?: ('mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun')[]; // which weekdays to apply on weekly mode
  applyUntil?: string; // ISO date string: apply until this date (inclusive)
  updatedAt?: string;
  isSynced?: boolean;
  deletedAt?: string;
}

export interface WeekMetadata {
  weekStarting: string;
  color?: string;
  note?: string;
  isImportant?: boolean;
}

export type Language = 'en' | 'vi';
export type Theme = 'light' | 'dark';
export type NotificationSound = 'bird' | 'wind' | 'bell' | 'chime';
export type MusicPlaybackMode = 'play_once' | 'loop_one' | 'loop_all' | 'shuffle';
export type CatMood = 'idle' | 'work' | 'gym' | 'medical' | 'shortBreak' | 'longBreak' | 'celebrating' | 'tired' | 'happy';
export type CatColor = 'orange' | 'pink' | 'blue' | 'green' | 'purple' | 'yellow' | 'teal' | 'red' | 'gray' | 'black' | 'white';
export type BackgroundType = 'color' | 'gradient' | 'image';
export type WeekTransitionEffect = 'none' | 'fade' | 'slide';

export interface MusicTrack {
  id: string;
  name: string;
  url: string;
  isCustom?: boolean;
  source?: 'preset' | 'custom';
  provider?: 'audio' | 'youtube';
  fileName?: string;
}

export interface BackgroundConfig {
  type: BackgroundType;
  value: string;
  opacity?: number;
}

export interface AppSettings {
  language: Language;
  theme: Theme;
  musicEnabled: boolean;
  musicVolume: number;
  musicTrackId: string;
  musicPlaybackMode: MusicPlaybackMode;
  customMusicDataUrl: string;
  customMusicName: string;
  notificationsEnabled: boolean;
  notificationSound: NotificationSound;
  startHour: number;
  endHour: number;
  backgroundConfig?: BackgroundConfig;
  catEnabled?: boolean;
  gymRestEnabled?: boolean;
  gymRestDurationSeconds?: number;
  gymRestSoundEnabled?: boolean;
  gymRestVibrationEnabled?: boolean;
  showLunarCalendar?: boolean;
  desktopSidebarEnabled?: boolean;
  desktopFontSize?: 'small' | 'medium' | 'large';
  desktopKeyboardShortcutsEnabled?: boolean;
  catColor?: CatColor;
  weekTransitionEffect?: WeekTransitionEffect;
}

export interface WeeklySchedule {
  weekStarting: string;
  plans: Plan[];
}
