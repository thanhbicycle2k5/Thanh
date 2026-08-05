/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { 
  format, 
  startOfWeek, 
  addWeeks, 
  subWeeks, 
  isSameDay,
  isSameWeek,
  isAfter,
  startOfDay,
} from 'date-fns';
import { Plan, NotificationSound, WeekTransitionEffect, MusicPlaybackMode, MusicTrack } from './types';
import { storage, normalizeSettings, defaultSettings } from './lib/storage';
import { auth, db, signInWithGoogle, signOutUser, clearAuthState, onAuthChanged, cloudStorage, subscribePlans, settleRedirectAuth } from './lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { PRESET_TRACKS } from './lib/musicTracks';
import { listCustomTracks, saveCustomTrack, removeCustomTrack, loadMusicPlayerState, saveMusicPlayerState, resetMusicPlayerState, getNextTrackId } from './lib/musicPlayer';
import { playNotificationSound, playMusicalNote, playCompletionMelody, playMeow } from './lib/sounds';
import { getSchedulyMessage, SchedulyStatus } from './lib/schedulyMessages';
import { healthTipsManager } from './lib/healthTips';
import { requestUniversalNotificationPermission, registerNotificationWorker, scheduleTaskNotification, cancelScheduledNotificationById, showImmediateNotification, buildNotificationTitle, buildNotificationBody, clearScheduledNotifications as clearAllWorkerNotifications, showNowNotification } from './lib/notification';
import { User } from 'firebase/auth';
import { ScheduleGrid } from './components/ScheduleGrid';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Trophy, 
  CheckCircle2,
  Settings,
  Moon,
  Sun,
  Volume2,
  LogIn,
  LogOut,
  CloudIcon,
  Loader2,
  Bell,
  BellOff,
  Music,
  Plus,
  Minus,
  Trash2,
  Upload,
  Play,
  Pause,
  RotateCcw,
  X,
  Timer,
  Dumbbell,
  Zap,
  BookOpen,
  Move,
} from 'lucide-react';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { translations, TranslationKey } from './lib/i18n';
import { AppSettings, Language, Theme, CatMood, CatColor, BackgroundConfig } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { DynamicCat } from './components/DynamicCat';
import { SpeechBubbleOverlay } from './components/SpeechBubbleOverlay';
import { BackgroundCustomizer } from './components/BackgroundCustomizer';
import { CelebrationEffect } from './components/CelebrationEffect';
import { QuickNoteEditor } from './components/QuickNoteEditor';

import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function WeekNoteEditor({ weekStart, initialNote, theme, placeholder, onSave, btnSaveText, btnSavedText }: {
  weekStart: Date;
  initialNote: string;
  theme: Theme;
  placeholder: string;
  onSave: (note: string) => void;
  btnSaveText: string;
  btnSavedText: string;
}) {
  const [note, setNote] = React.useState(initialNote);
  const [saved, setSaved] = React.useState(false);
  React.useEffect(() => { setNote(initialNote); }, [weekStart.toISOString()]);
  const handleSave = () => {
    onSave(note);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  return (
    <div className="space-y-1.5">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="text-xs resize-none w-full bg-muted/50 border-border"
      />
      <Button
        size="sm"
        className={cn("w-full h-6 text-[10px]", saved ? "bg-[#107C41]" : "bg-muted-foreground hover:bg-muted-foreground/80")}
        onClick={() => { playMusicalNote(); handleSave(); }}
      >
        {saved ? `✓ ${btnSavedText}` : btnSaveText}
      </Button>
    </div>
  );
}

function HealthTipPanel({ theme, isSettingsOpen, t, lang, onActivate }: { theme: Theme; isSettingsOpen: boolean; t: (k: TranslationKey) => string; lang: Language; onActivate?: (m: CatMood) => void }) {
  const [open, setOpen] = React.useState(false);
  const [tip, setTip] = React.useState('');
  const [allTips, setAllTips] = React.useState<string[]>([]);

  React.useEffect(() => {
    setAllTips(healthTipsManager.getAllTips(lang));
  }, [lang]);

  const pickTip = React.useCallback(() => {
    if (allTips.length > 0) {
      setTip(allTips[Math.floor(Math.random() * allTips.length)]);
    }
  }, [allTips]);

  React.useEffect(() => {
    if (!open) return;
    pickTip();
    const interval = setInterval(pickTip, 10000);
    return () => clearInterval(interval);
  }, [open, pickTip]);

  React.useEffect(() => {
    if (isSettingsOpen) setOpen(false);
  }, [isSettingsOpen]);

  return (
    <div className="relative inline-block pointer-events-auto">
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => {
          playMusicalNote();
          setOpen((v) => { const next = !v; if (next && onActivate) onActivate('medical'); return next; });
        }}
        className="h-12 w-12 rounded-full shadow-2xl flex items-center justify-center border transition-all hover:scale-110 active:scale-95 group bg-background text-foreground border-border"
        title={t('healthTips')}
      >
        <div className="relative flex items-center justify-center">
          <BookOpen className="w-6 h-6" />
          <div className="absolute inset-0 flex items-center justify-center pt-0.5">
             <Plus className="w-2.5 h-2.5 text-red-600 font-black" strokeWidth={5} />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
               "absolute z-40 w-[20rem] right-0 bottom-14 border shadow-2xl rounded-xl overflow-hidden cursor-move bg-card border-border"
            )}
          >
            <Card className="border-0 shadow-none bg-transparent">
              <CardContent className="p-0">
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted">
                   <span className="text-[10px] font-bold uppercase tracking-wider">{t('healthTips')}</span>
                   <X className="w-3.5 h-3.5 cursor-pointer hover:text-red-500 transition-colors" onClick={() => { playMusicalNote(); setOpen(false); }} />
                </div>
                <div className="p-4 space-y-3">
                   <p className="text-xs leading-relaxed opacity-90">{tip}</p>
                   <Button variant="secondary" size="xs" onClick={() => { playMusicalNote(); pickTip(); }} className="w-full text-[10px] h-7">
                     {t('nextTip')}
                   </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

class SettingsErrorBoundary extends React.Component<{
  children: React.ReactNode;
  onError: (message: string) => void;
  fallback?: React.ReactNode;
}, {
  hasError: boolean;
  errorMessage: string;
}> {
  state = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message || 'Unknown error' };
  }

  componentDidCatch(error: Error) {
    console.error('Settings render error:', error);
    this.props.onError(error?.message || 'Unknown error');
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex min-h-[20rem] items-center justify-center p-6">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-semibold text-red-800">Failed to load settings.</p>
            <p className="mt-2 text-xs text-red-700">{this.state.errorMessage}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const WEEK_COLORS = [
  { name: 'Default', value: 'bg-muted' },
  { name: 'Red', value: 'bg-red-500/10 border-red-500/20' },
  { name: 'Green', value: 'bg-green-500/10 border-green-500/20' },
  { name: 'Blue', value: 'bg-blue-500/10 border-blue-500/20' },
  { name: 'Yellow', value: 'bg-yellow-500/10 border-yellow-500/20' },
  { name: 'Purple', value: 'bg-purple-500/10 border-purple-500/20' },
  { name: 'Orange', value: 'bg-orange-500/10 border-orange-500/20' },
];

const Logo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 1024 1024" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" rx="192" fill="#107C41"/>
    
    {/* Horizontal Bar */}
    <rect x="64" y="176" width="896" height="240" rx="40" fill="white"/>
    <circle cx="500" cy="200" r="60" fill="white"/>
    <circle cx="500" cy="392" r="60" fill="white"/>
    
    {/* Stem */}
    <rect x="478" y="416" width="64" height="88" fill="white"/>
    
    {/* Clock Circle */}
    <circle cx="510" cy="740" r="236" fill="white"/>
    
    {/* Ticks */}
    <rect x="498" y="540" width="24" height="60" rx="12" fill="#107C41"/>
    <rect x="666" y="728" width="56" height="24" rx="12" fill="#107C41"/>
    <rect x="498" y="890" width="24" height="50" rx="12" fill="#107C41"/>
    <rect x="300" y="728" width="54" height="24" rx="12" fill="#107C41"/>
    
    {/* Hands */}
    <rect x="495" y="560" width="30" height="180" rx="15" fill="#107C41"/>
    <rect x="495" y="620" width="30" height="120" rx="15" fill="#107C41" transform="rotate(-60 510 740)"/>
    <circle cx="510" cy="740" r="36" fill="#107C41"/>

    {/* Details on book */}
    <rect x="120" y="260" width="300" height="24" rx="12" fill="#75B891"/>
    <rect x="120" y="320" width="300" height="24" rx="12" fill="#75B891"/>
    <rect x="614" y="260" width="300" height="24" rx="12" fill="#75B891"/>
    <rect x="614" y="320" width="300" height="24" rx="12" fill="#75B891"/>
  </svg>
);

export default function App() {
  const [plans, setPlans] = React.useState<Plan[]>(() => storage.getPlans());
  const [weekMetas, setWeekMetas] = React.useState<Record<string, any>>(() => storage.getWeekMetas());
  const [isSummaryOpen, setIsSummaryOpen] = React.useState(false);
  const plansRef = React.useRef<Plan[]>(plans);
  const weekMetasRef = React.useRef<Record<string, any>>(weekMetas);
  const settingsRef = React.useRef<AppSettings>(normalizeSettings(storage.getSettings()));
  React.useEffect(() => {
    plansRef.current = plans;
  }, [plans]);
  React.useEffect(() => {
    weekMetasRef.current = weekMetas;
  }, [weekMetas]);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [gymRestOpen, setGymRestOpen] = React.useState(false);
  const [gymRestRunning, setGymRestRunning] = React.useState(false);
  const [gymRestRemaining, setGymRestRemaining] = React.useState(60);
  const [gymRestEndAt, setGymRestEndAt] = React.useState<number | null>(null);
  const [gymRestRound, setGymRestRound] = React.useState(1);
  const [gymRestSets, setGymRestSets] = React.useState(4);
  const [gymRestMessage, setGymRestMessage] = React.useState('');
  const [gymRestCustomOpen, setGymRestCustomOpen] = React.useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = React.useState('general');
  const [mobileExpanded, setMobileExpanded] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [settingsState, setSettings] = React.useState<AppSettings>(() => normalizeSettings(storage.getSettings()));
  const [settingsError, setSettingsError] = React.useState<string | null>(null);

  React.useEffect(() => {
    settingsRef.current = settingsState;
  }, [settingsState]);

  const [isNoteOpen, setIsNoteOpen] = React.useState(false);
  const [noteText, setNoteText] = React.useState('');
  const [isMobile, setIsMobile] = React.useState(false);
  const [isMobileNote, setIsMobileNote] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia('(max-width: 768px)');
    setIsMobile(query.matches);
    setIsMobileNote(query.matches);
    const handleMediaChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
      setIsMobileNote(event.matches);
    };
    query.addEventListener('change', handleMediaChange);

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionChange = () => setPrefersReducedMotion(motionQuery.matches);
    motionChange();
    motionQuery.addEventListener('change', motionChange);

    return () => {
      query.removeEventListener('change', handleMediaChange);
      motionQuery.removeEventListener('change', motionChange);
    };
  }, []);

  React.useEffect(() => {
    if (!gymRestRunning) {
      setGymRestRemaining(settingsState.gymRestDurationSeconds ?? 60);
    }
  }, [settingsState.gymRestDurationSeconds, gymRestRunning]);

  type PomodoroMode = 'work' | 'short' | 'long';
  const POMODORO_DURATIONS: Record<PomodoroMode, number> = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const [isPomodoroOpen, setIsPomodoroOpen] = React.useState(false);
  const [pomodoroMode, setPomodoroMode] = React.useState<PomodoroMode>('work');
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = React.useState(POMODORO_DURATIONS.work);
  const [pomodoroRunning, setPomodoroRunning] = React.useState(false);
  const [pomodoroSessions, setPomodoroSessions] = React.useState(0);
  const [showCelebration, setShowCelebration] = React.useState(false);
  const [catMoodOverride, setCatMoodOverride] = React.useState<CatMood | null>(null);
  const [speechBubble, setSpeechBubble] = React.useState<{ id: string; text: string; status: SchedulyStatus } | null>(null);
  const speechBubbleTimeoutRef = React.useRef<number | null>(null);
  const [catPosition, setCatPosition] = React.useState<{ left: number; top: number } | null>(null);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pomodoroRunning && pomodoroSecondsLeft > 0) {
      interval = setInterval(() => {
        setPomodoroSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (pomodoroSecondsLeft === 0) {
      setPomodoroRunning(false);
      playNotificationSound(settingsState.notificationSound);
      if (pomodoroMode === 'work') setPomodoroSessions(v => v + 1);
      toast.success(t(pomodoroMode === 'work' ? 'workCompleted' : 'breakOver'));
    }
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroSecondsLeft, pomodoroMode, settingsState.notificationSound]);

  const togglePomodoro = () => setPomodoroRunning(!pomodoroRunning);
  const resetPomodoro = () => {
    setPomodoroRunning(false);
    setPomodoroSecondsLeft(POMODORO_DURATIONS[pomodoroMode]);
  };
  const switchPomodoroMode = (mode: PomodoroMode) => {
    setPomodoroMode(mode);
    setPomodoroSecondsLeft(POMODORO_DURATIONS[mode]);
    setPomodoroRunning(false);
  };

  const [playlistTracks, setPlaylistTracks] = React.useState<MusicTrack[]>(PRESET_TRACKS);
  const [selectedMusicId, setSelectedMusicId] = React.useState<string | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = React.useState(false);
  const [musicPlaybackMode, setMusicPlaybackMode] = React.useState<MusicPlaybackMode>('loop_all');
  const [musicInputUrl, setMusicInputUrl] = React.useState('');
  const [musicError, setMusicError] = React.useState<string | null>(null);
  const [isMusicLoading, setIsMusicLoading] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const selectedTrackRef = React.useRef<MusicTrack | null>(null);

  React.useEffect(() => {
    const persisted = loadMusicPlayerState();
    setSelectedMusicId(persisted.currentTrackId ?? settingsState.musicTrackId ?? null);
    setMusicPlaybackMode(persisted.playbackMode ?? settingsState.musicPlaybackMode ?? 'loop_all');
    setIsMusicPlaying(persisted.isPlaying);
  }, []);

  React.useEffect(() => {
    let active = true;
    void listCustomTracks().then((tracks) => {
      if (!active) return;
      setPlaylistTracks([...PRESET_TRACKS, ...tracks]);
      if (!selectedMusicId) {
        const persisted = loadMusicPlayerState();
        if (persisted.currentTrackId) {
          const exists = tracks.some((track) => track.id === persisted.currentTrackId);
          if (exists) {
            setSelectedMusicId(persisted.currentTrackId);
          }
        }
      }
    }).catch(() => {
      setPlaylistTracks(PRESET_TRACKS);
    });
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    if (!selectedMusicId) {
      return;
    }
    const track = playlistTracks.find((item) => item.id === selectedMusicId);
    if (!track) {
      setSelectedMusicId(null);
      setIsMusicPlaying(false);
      return;
    }
    selectedTrackRef.current = track;
  }, [playlistTracks, selectedMusicId]);

  const persistMusicState = React.useCallback((nextTrackId: string | null, nextPlaybackMode: MusicPlaybackMode, nextIsPlaying: boolean) => {
    saveMusicPlayerState({
      currentTrackId: nextTrackId,
      playbackMode: nextPlaybackMode,
      volume: settingsState.musicVolume ?? 0.3,
      isPlaying: nextIsPlaying,
    });
  }, [settingsState.musicVolume]);

  const playTrack = React.useCallback((trackId: string | null, shouldPlay = true) => {
    if (!trackId) {
      audioRef.current?.pause();
      setIsMusicPlaying(false);
      setSelectedMusicId(null);
      persistMusicState(null, musicPlaybackMode, false);
      return;
    }

    const track = playlistTracks.find((item) => item.id === trackId);
    if (!track) {
      return;
    }

    setSelectedMusicId(track.id);
    if (!audioRef.current) {
      audioRef.current = new Audio(track.url);
    } else {
      audioRef.current.src = track.url;
    }
    audioRef.current.volume = settingsState.musicVolume ?? 0.3;
    audioRef.current.load();

    if (shouldPlay && settingsState.musicEnabled) {
      void audioRef.current.play().then(() => {
        setIsMusicPlaying(true);
      }).catch(() => {
        setIsMusicPlaying(false);
      });
    } else {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    }

    handleUpdateSettings({ musicTrackId: track.id, musicPlaybackMode, musicVolume: settingsState.musicVolume ?? 0.3 });
    persistMusicState(track.id, musicPlaybackMode, shouldPlay && settingsState.musicEnabled);
  }, [handleUpdateSettings, musicPlaybackMode, persistMusicState, playlistTracks, settingsState.musicEnabled, settingsState.musicVolume]);

  React.useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = settingsState.musicVolume ?? 0.3;
    if (selectedMusicId && settingsState.musicEnabled && isMusicPlaying) {
      void audioRef.current.play().catch(() => {
        setIsMusicPlaying(false);
      });
    }
  }, [settingsState.musicVolume, selectedMusicId, settingsState.musicEnabled, isMusicPlaying]);

  React.useEffect(() => {
    if (!settingsState.musicEnabled) {
      audioRef.current?.pause();
      setIsMusicPlaying(false);
      persistMusicState(selectedMusicId, musicPlaybackMode, false);
    }
  }, [persistMusicState, selectedMusicId, musicPlaybackMode, settingsState.musicEnabled]);

  const toggleMusic = () => {
    if (!selectedMusicId) {
      const firstTrack = playlistTracks[0];
      if (firstTrack) {
        playTrack(firstTrack.id, true);
      }
      return;
    }

    if (isMusicPlaying) {
      audioRef.current?.pause();
      setIsMusicPlaying(false);
      persistMusicState(selectedMusicId, musicPlaybackMode, false);
    } else {
      if (audioRef.current) {
        void audioRef.current.play().then(() => setIsMusicPlaying(true)).catch(() => setIsMusicPlaying(false));
      } else {
        playTrack(selectedMusicId, true);
      }
      persistMusicState(selectedMusicId, musicPlaybackMode, true);
    }
  };

  const playNextTrack = () => {
    if (!playlistTracks.length) return;
    if (!selectedMusicId) {
      playTrack(playlistTracks[0].id, true);
      return;
    }
    const currentIndex = playlistTracks.findIndex((track) => track.id === selectedMusicId);
    const nextId = getNextTrackId({ tracks: playlistTracks, currentTrackId: selectedMusicId, playbackMode: musicPlaybackMode, currentIndex });
    if (nextId) {
      playTrack(nextId, true);
    }
  };

  const playPreviousTrack = () => {
    if (!playlistTracks.length) return;
    if (!selectedMusicId) {
      playTrack(playlistTracks[playlistTracks.length - 1].id, true);
      return;
    }
    const currentIndex = playlistTracks.findIndex((track) => track.id === selectedMusicId);
    const previousIndex = currentIndex <= 0 ? playlistTracks.length - 1 : currentIndex - 1;
    playTrack(playlistTracks[previousIndex].id, true);
  };

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => {
      if (musicPlaybackMode === 'play_once') {
        setIsMusicPlaying(false);
        persistMusicState(selectedMusicId, musicPlaybackMode, false);
        return;
      }
      if (!selectedMusicId) {
        return;
      }
      const currentIndex = playlistTracks.findIndex((track) => track.id === selectedMusicId);
      const nextId = getNextTrackId({ tracks: playlistTracks, currentTrackId: selectedMusicId, playbackMode: musicPlaybackMode, currentIndex });
      if (nextId) {
        playTrack(nextId, true);
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [musicPlaybackMode, playTrack, persistMusicState, playlistTracks, selectedMusicId]);

  const handleAddMusicUrl = React.useCallback(async () => {
    const trimmed = musicInputUrl.trim();
    if (!trimmed) {
      setMusicError(t('enterMusicUrl'));
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      setMusicError(t('enterMusicUrl'));
      return;
    }

    setIsMusicLoading(true);
    setMusicError(null);
    try {
      const customTrack = await saveCustomTrack({
        id: `custom-url-${Date.now()}`,
        name: `Custom ${new Date().toLocaleTimeString()}`,
        url: trimmed,
        isCustom: true,
        source: 'url',
      });
      const nextTracks = [...playlistTracks.filter((track) => track.id !== customTrack.id), customTrack];
      setPlaylistTracks(nextTracks);
      playTrack(customTrack.id, true);
    } catch (error) {
      setMusicError(error instanceof Error ? error.message : 'Could not add music URL');
    } finally {
      setIsMusicLoading(false);
      setMusicInputUrl('');
    }
  }, [musicInputUrl, playTrack, playlistTracks, t]);

  const handleRemoveTrack = React.useCallback(async (trackId: string) => {
    const track = playlistTracks.find((item) => item.id === trackId);
    if (!track?.isCustom) return;
    try {
      await removeCustomTrack(trackId);
      const nextTracks = playlistTracks.filter((item) => item.id !== trackId);
      setPlaylistTracks(nextTracks);
      if (selectedMusicId === trackId) {
        const fallbackTrack = nextTracks[0];
        if (fallbackTrack) {
          playTrack(fallbackTrack.id, isMusicPlaying);
        } else {
          playTrack(null, false);
        }
      }
    } catch (error) {
      setMusicError(error instanceof Error ? error.message : 'Could not remove track');
    }
  }, [isMusicPlaying, playTrack, playlistTracks, selectedMusicId]);

  const t = React.useCallback((key: keyof typeof translations.en, params: Record<string, string> = {}) => {
    const locale = translations[settingsState.language] ?? translations.en;
    let text = locale[key] ?? translations.en[key] ?? key;
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
    return text;
  }, [settingsState.language]);

  const [selectedWeekStart, setSelectedWeekStart] = React.useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const previousWeekStartRef = React.useRef<Date>(selectedWeekStart);

  const weekTransitionDirection = React.useMemo(() => {
    const previous = previousWeekStartRef.current;
    if (previous.getTime() === selectedWeekStart.getTime()) return 'forward';
    return isAfter(selectedWeekStart, previous) ? 'forward' : 'backward';
  }, [selectedWeekStart]);

  React.useEffect(() => {
    previousWeekStartRef.current = selectedWeekStart;
  }, [selectedWeekStart]);

  const actualWeekTransitionEffect: WeekTransitionEffect = React.useMemo(() => {
    if (prefersReducedMotion && settingsState.weekTransitionEffect === 'slide') {
      return 'fade';
    }
    return settingsState.weekTransitionEffect ?? 'slide';
  }, [prefersReducedMotion, settingsState.weekTransitionEffect]);

  const [loginLoading, setLoginLoading] = React.useState(false);

  const syncPendingUserData = React.useCallback(async (uid: string) => {
    if (typeof window === 'undefined' || !('navigator' in window) || !navigator.onLine) {
      return;
    }

    const pendingPlans = storage.hasPendingSyncFor(uid, 'plans');
    const pendingWeekMeta = storage.hasPendingSyncFor(uid, 'week_meta');
    const pendingSettings = storage.hasPendingSyncFor(uid, 'settings');

    if (!pendingPlans && !pendingWeekMeta && !pendingSettings) {
      return;
    }

    setSyncing(true);
    let syncedAny = false;
    try {
      if (pendingPlans) {
        const localPlans = storage.getPlans(uid);
        await cloudStorage.savePlans(uid, localPlans);
        storage.markPlansSynced(localPlans.map((plan) => plan.id), uid);
        storage.clearSyncedDeletedPlans(uid, true);
        storage.clearPendingSync(uid, 'plans');
        syncedAny = true;
      }

      if (pendingWeekMeta) {
        const localMetas = storage.getWeekMetas(uid);
        await Promise.all(
          Object.entries(localMetas).map(([weekStart, meta]) =>
            cloudStorage.saveWeekMeta(uid, weekStart, meta)
          )
        );
        storage.clearPendingSync(uid, 'week_meta');
        syncedAny = true;
      }

      if (pendingSettings) {
        const localSettings = storage.getSettings(uid);
        await cloudStorage.saveSettings(uid, localSettings);
        storage.clearPendingSync(uid, 'settings');
        syncedAny = true;
      }

      if (syncedAny) {
        toast.success(t('offlineSyncRestored'));
      }
    } catch (error) {
      console.warn('Pending sync failed:', error);
    } finally {
      setSyncing(false);
    }
  }, [t]);

  const resetAppStateForGuest = React.useCallback((options?: { preserveAnonymousStorage?: boolean }) => {
    const preserveAnonymousStorage = options?.preserveAnonymousStorage ?? false;

    setPlans([]);
    setWeekMetas({});
    setIsSummaryOpen(false);
    setIsSettingsOpen(false);
    setGymRestOpen(false);
    setGymRestRunning(false);
    setGymRestRemaining(60);
    setGymRestEndAt(null);
    setGymRestRound(1);
    setGymRestSets(4);
    setGymRestMessage('');
    setGymRestCustomOpen(false);
    setActiveSettingsTab('general');
    setMobileExpanded(null);
    setIsCalendarOpen(false);
    setIsNoteOpen(false);
    setNoteText('');
    setSelectedWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    previousWeekStartRef.current = startOfWeek(new Date(), { weekStartsOn: 1 });
    setIsMobileNote(false);
    setIsPomodoroOpen(false);
    setPomodoroMode('work');
    setPomodoroSecondsLeft(POMODORO_DURATIONS.work);
    setPomodoroRunning(false);
    setPomodoroSessions(0);
    setShowCelebration(false);
    setCatMoodOverride(null);
    setSpeechBubble(null);
    if (speechBubbleTimeoutRef.current !== null) {
      window.clearTimeout(speechBubbleTimeoutRef.current);
      speechBubbleTimeoutRef.current = null;
    }
    setCatPosition(null);
    setPlaylistTracks(PRESET_TRACKS);
    setSelectedMusicId(null);
    setIsMusicPlaying(false);
    setMusicPlaybackMode('loop_all');
    setMusicInputUrl('');
    setMusicError(null);
    setIsMusicLoading(false);
    setLoginLoading(false);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.3;
      audioRef.current.src = '';
      audioRef.current.load();
    }

    const guestSettings = normalizeSettings(defaultSettings);
    plansRef.current = [];
    weekMetasRef.current = {};
    settingsRef.current = guestSettings;
    setSettings(guestSettings);
    if (!preserveAnonymousStorage) {
      storage.resetUserData();
      resetMusicPlayerState();
      localStorage.removeItem('chronos_quick_note');
    }

    if (!preserveAnonymousStorage) {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [POMODORO_DURATIONS.work]);

  React.useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      if (user) {
        await syncPendingUserData(user.uid);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      clearAllScheduledNotifications();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, syncPendingUserData]);

  // Data Migration / Initial Fetch
  React.useEffect(() => {
     settleRedirectAuth()
       .then(res => { if (res?.user) setUser(res.user); })
       .catch(err => {
         console.error("Initial redirect result error:", err);
         toast.error(t('loginFailed'));
       });

     let unsubPlans: (() => void) | null = null;
     const unsubscribeAuth = onAuthChanged(async (firebaseUser) => {
        if (unsubPlans) {
          unsubPlans();
          unsubPlans = null;
        }

        setUser(firebaseUser);
        setAuthLoading(false);

        if (!firebaseUser) {
          resetAppStateForGuest({ preserveAnonymousStorage: false });
        }

        const anonymousPlans = storage.getPlans();
        const anonymousWeekMetas = storage.getWeekMetas();
        const anonymousSettings = normalizeSettings(storage.getSettings());

        const localPlansForUid = firebaseUser ? storage.getPlans(firebaseUser.uid) : [];
        const localMetasForUid = firebaseUser ? storage.getWeekMetas(firebaseUser.uid) : {};
        const rawLocalSettingsForUid = firebaseUser && storage.hasStoredSettings(firebaseUser.uid)
          ? storage.getSettings(firebaseUser.uid)
          : undefined;
        const anonymousSettingsFromStorage = storage.hasStoredSettings() ? storage.getSettings() : undefined;
        const hasPendingSync = firebaseUser ? storage.hasPendingSync(firebaseUser.uid) : false;
        const hasExistingLocalData = anonymousPlans.length > 0 || Object.keys(anonymousWeekMetas).length > 0 || storage.hasStoredSettings() || (firebaseUser ? storage.hasStoredSettings(firebaseUser.uid) : false);
        const currentPlansFallback = plansRef.current.length > 0 ? plansRef.current : anonymousPlans;
        const currentWeekMetasFallback = Object.keys(weekMetasRef.current).length > 0 ? weekMetasRef.current : anonymousWeekMetas;
        const currentSettingsFallback = Object.keys(settingsRef.current).length > 0 && JSON.stringify(settingsRef.current) !== JSON.stringify(anonymousSettings)
          ? settingsRef.current
          : anonymousSettings;

        if (firebaseUser) {
           resetAppStateForGuest({ preserveAnonymousStorage: true });
           const mergePlans = (base: Plan[], extra: Plan[]) => {
             const map = new Map<string, Plan>();
             base.forEach((plan) => map.set(plan.id, plan));
             extra.forEach((plan) => {
               if (!map.has(plan.id)) {
                 map.set(plan.id, plan);
               }
             });
             return Array.from(map.values());
           };

           const mergedPlans = mergePlans(localPlansForUid, anonymousPlans);
           const localPlanIds = new Set(localPlansForUid.map((plan) => plan.id));
           const planMergeNeeded = mergedPlans.length !== localPlansForUid.length || mergedPlans.some((plan) => !localPlanIds.has(plan.id));
           if (planMergeNeeded) {
             storage.savePlans(mergedPlans, firebaseUser.uid);
             storage.setPendingSync(firebaseUser.uid, 'plans', true);
           }

           const mergedWeekMetas = { ...localMetasForUid, ...anonymousWeekMetas };
           const weekMetaChanged = Object.keys(mergedWeekMetas).some((key) => {
             const existing = localMetasForUid[key];
             const incoming = anonymousWeekMetas[key];
             return incoming && JSON.stringify(existing) !== JSON.stringify(incoming);
           });
           if (weekMetaChanged) {
             Object.entries(anonymousWeekMetas).forEach(([weekStart, meta]) => {
               storage.saveWeekMeta(weekStart, meta, firebaseUser.uid);
             });
             storage.setPendingSync(firebaseUser.uid, 'week_meta', true);
           }

           const mergedSettings = normalizeSettings({ ...(rawLocalSettingsForUid ?? {}), ...(anonymousSettingsFromStorage ?? {}) });
           const settingsFromUidExist = storage.hasStoredSettings(firebaseUser.uid);
           const settingsFromAnonExist = storage.hasStoredSettings();
           if (settingsFromAnonExist) {
             storage.saveSettings(mergedSettings, firebaseUser.uid);
             storage.setPendingSync(firebaseUser.uid, 'settings', true);
           }

           const initialPlans = mergedPlans.length > 0 ? mergedPlans : currentPlansFallback;
           const initialWeekMetas = Object.keys(mergedWeekMetas).length > 0 ? mergedWeekMetas : currentWeekMetasFallback;
           const initialSettings = normalizeSettings({ ...currentSettingsFallback, ...mergedSettings });
           setPlans(initialPlans);
           setWeekMetas(initialWeekMetas);
           setSettings(initialSettings);
           setSyncing(true);

           if (navigator.onLine && (hasPendingSync || anonymousPlans.length > 0 || Object.keys(anonymousWeekMetas).length > 0 || settingsFromAnonExist)) {
             await syncPendingUserData(firebaseUser.uid);
           }

           try {
             console.log("Starting cloud sync for user:", firebaseUser.uid);

             if (!auth.currentUser) {
               await new Promise(r => setTimeout(r, 500));
             }

             if (!auth.currentUser) {
               throw new Error("Authentication state not ready.");
             }

             const [cloudPlans, cloudWeekMetas, cloudSettings] = await Promise.all([
               cloudStorage.getPlans(firebaseUser.uid).catch(() => [] as Plan[]),
               cloudStorage.getWeekMetas(firebaseUser.uid).catch(() => ({})),
               cloudStorage.getSettings(firebaseUser.uid).catch(() => ({}))
             ]);

             if (cloudPlans.length === 0) {
               const plansToMigrate = localPlansForUid.length > 0 ? localPlansForUid : anonymousPlans;
               if (plansToMigrate.length > 0) {
                 await cloudStorage.savePlans(firebaseUser.uid, plansToMigrate);
                 storage.savePlans(plansToMigrate, firebaseUser.uid, false);
                 toast.success(t('dataSynced'));
               }
             }

             if (Object.keys(cloudWeekMetas).length === 0) {
               const metasToMigrate = Object.keys(localMetasForUid).length > 0 ? localMetasForUid : anonymousWeekMetas;
               if (Object.keys(metasToMigrate).length > 0) {
                 await setDoc(doc(db, "users", firebaseUser.uid, "meta", "weekMetas"), metasToMigrate);
                 Object.entries(metasToMigrate).forEach(([weekStart, meta]) => {
                   storage.saveWeekMeta(weekStart, meta, firebaseUser.uid, false);
                 });
               }
             }

               if (Object.keys(cloudSettings).length === 0 && Object.keys(rawLocalSettingsForUid ?? {}).length === 0 && Object.keys(anonymousSettingsFromStorage ?? {}).length > 0) {
               await cloudStorage.saveSettings(firebaseUser.uid, anonymousSettingsFromStorage!);
               storage.saveSettings(anonymousSettingsFromStorage!, firebaseUser.uid, false);
             }

             const initialPlans = hasPendingSync
               ? localPlansForUid
               : cloudPlans.length > 0
                 ? cloudPlans
                 : (localPlansForUid.length > 0 ? localPlansForUid : currentPlansFallback);
             setPlans(initialPlans);

             const initialMetas = hasPendingSync
               ? localMetasForUid
               : Object.keys(cloudWeekMetas).length > 0
                 ? cloudWeekMetas
                 : (Object.keys(localMetasForUid).length > 0 ? localMetasForUid : currentWeekMetasFallback);
             setWeekMetas(initialMetas);

             if (!hasPendingSync && Object.keys(cloudSettings).length > 0) {
               setSettings(prev => normalizeSettings({ ...prev, ...cloudSettings }));
             } else if (hasExistingLocalData) {
               setSettings(prev => normalizeSettings({ ...prev, ...currentSettingsFallback }));
             }

             if (navigator.onLine) {
               unsubPlans = subscribePlans(firebaseUser.uid, p => {
                  const hasPendingPlanSync = storage.hasPendingSyncFor(firebaseUser.uid, 'plans');
                  const shouldApplyCloudSnapshot = !hasPendingPlanSync || initialPlans.length === 0;
                  if (shouldApplyCloudSnapshot) {
                    setPlans(p);
                    storage.savePlans(p, firebaseUser.uid, false);
                  }
                  setSyncing(false);
               });
             } else {
               setSyncing(false);
             }
           } catch (e) {
             console.error("Failed to sync/migrate data:", e);
             setSyncing(false);
             const fallbackPlans = localPlansForUid.length > 0 ? localPlansForUid : (plansRef.current.length > 0 ? plansRef.current : anonymousPlans);
             const fallbackMetas = Object.keys(localMetasForUid).length > 0 ? localMetasForUid : (Object.keys(weekMetasRef.current).length > 0 ? weekMetasRef.current : anonymousWeekMetas);
             const fallbackSettings = normalizeSettings({ ...currentSettingsFallback, ...(rawLocalSettingsForUid ?? {}) });
             setPlans(fallbackPlans);
             setWeekMetas(fallbackMetas);
             setSettings(fallbackSettings);
           }
        } else {
           const fallbackPlans = plansRef.current.length > 0 ? plansRef.current : anonymousPlans;
           const fallbackMetas = Object.keys(weekMetasRef.current).length > 0 ? weekMetasRef.current : anonymousWeekMetas;
           const fallbackSettings = hasExistingLocalData ? normalizeSettings({ ...currentSettingsFallback, ...anonymousSettings }) : anonymousSettings;
           setPlans(fallbackPlans);
           setWeekMetas(fallbackMetas);
           setSettings(fallbackSettings);
           setSyncing(false);
        }
     });

     return () => {
       unsubscribeAuth();
       if (unsubPlans) {
         unsubPlans();
       }
     };
  }, []);

  const clearAllScheduledNotifications = React.useCallback(async () => {
    if (notificationScannerRef.current !== null) {
      window.clearInterval(notificationScannerRef.current);
      notificationScannerRef.current = null;
    }
    await clearAllWorkerNotifications();
  }, [clearAllWorkerNotifications]);

  const stopNotifications = React.useCallback(() => {
    void clearAllScheduledNotifications();
  }, [clearAllScheduledNotifications]);

  const handleLogout = React.useCallback(async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.warn('Sign out failed', error);
    } finally {
      setUser(null);
      resetAppStateForGuest();
      storage.resetUserData();
      resetMusicPlayerState();
      localStorage.removeItem('chronos_quick_note');
    }
  }, [resetAppStateForGuest]);

  const handleUpdateSettings = React.useCallback((newSettings: Partial<AppSettings>) => {
    const updated = normalizeSettings({ ...settingsState, ...newSettings });
    setSettings(updated);
    storage.saveSettings(newSettings, user?.uid);
    if (updated.notificationsEnabled === false) {
      void clearAllScheduledNotifications();
    }
    if (user) {
      cloudStorage.saveSettings(user.uid, newSettings)
        .then(() => storage.setPendingSync(user.uid, 'settings', false))
        .catch((error) => {
          console.warn('Cloud settings save failed:', error);
        });
    }
  }, [settingsState, user, clearAllScheduledNotifications]);

  React.useEffect(() => {
    if (settingsState.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [settingsState.theme]);

  const firedNotificationIdsRef = React.useRef<Set<string>>(new Set());
  const notificationScannerRef = React.useRef<number | null>(null);

  const makeNotificationId = React.useCallback((plan: Plan) => {
    const title = plan.title?.trim() || 'nhiệm vụ';
    const nameToken = title.replace(/[\s\W]+/g, '_').toLowerCase();
    return `scheduly-${nameToken}-${plan.startHour}-${plan.date}`;
  }, []);

  const getEventDate = React.useCallback((plan: Plan) => {
    const eventDate = new Date(plan.date);
    eventDate.setHours(plan.startHour, 0, 0, 0);
    return eventDate;
  }, []);

  const getMinutesUntilStart = React.useCallback((plan: Plan) => {
    const now = Date.now();
    return (getEventDate(plan).getTime() - now) / 60_000;
  }, [getEventDate]);

  const isWithinReminderWindow = React.useCallback((minutesUntilStart: number) => {
    return minutesUntilStart >= 14 && minutesUntilStart <= 15;
  }, []);

  React.useEffect(() => {
    firedNotificationIdsRef.current = new Set(storage.getFiredNotificationIds(user?.uid));
  }, [user]);

  const showSpeechBubbleText = React.useCallback((status: SchedulyStatus, taskName?: string, id?: string) => {
    if (speechBubbleTimeoutRef.current !== null) {
      window.clearTimeout(speechBubbleTimeoutRef.current);
    }

    const text = getSchedulyMessage(status, taskName);
    setSpeechBubble({ id: id ?? crypto.randomUUID(), text, status });
    speechBubbleTimeoutRef.current = window.setTimeout(() => {
      setSpeechBubble(null);
      speechBubbleTimeoutRef.current = null;
    }, 5000);
  }, []);

  const getNotificationPermission = React.useCallback(async (): Promise<NotificationPermission> => {
    return await requestUniversalNotificationPermission();
  }, []);

  const sendReminderNotification = React.useCallback(async (plan: Plan) => {
    if (!isOnline || !settingsState.notificationsEnabled || plan.color === 'green') {
      return;
    }

    const today = startOfDay(new Date());
    if (!isSameDay(new Date(plan.date), today)) {
      return;
    }

    const notificationId = makeNotificationId(plan);
    if (firedNotificationIdsRef.current.has(notificationId)) {
      return;
    }

    const minutesUntilStart = getMinutesUntilStart(plan);
    if (!isWithinReminderWindow(minutesUntilStart)) {
      return;
    }

    const taskName = plan.title?.trim() || 'công việc';
    const remindAt = getEventDate(plan).getTime() - 15 * 60 * 1000;
    const payload = {
      id: notificationId,
      title: buildNotificationTitle(),
      body: buildNotificationBody(taskName),
      fireAt: remindAt,
    };

    if (settingsState.catEnabled !== false) {
      playMeow();
      showSpeechBubbleText('remind', taskName, notificationId);
    }

    try {
      if (remindAt <= Date.now()) {
        await showNowNotification(payload.title, payload.body, payload.id);
      } else {
        await scheduleTaskNotification(payload);
      }
    } catch (error) {
      console.error('Failed to schedule notification', error);
      showImmediateNotification(taskName);
    }

    firedNotificationIdsRef.current.add(notificationId);
    storage.addFiredNotificationId(notificationId, user?.uid);
  }, [makeNotificationId, user, showSpeechBubbleText, getEventDate, getMinutesUntilStart, isWithinReminderWindow, isOnline, settingsState]);

  const scheduleUpcomingNotifications = React.useCallback(async () => {
    if (!isOnline || !settingsState.notificationsEnabled) {
      return;
    }

    await clearAllScheduledNotifications();
    if (typeof window === 'undefined') {
      return;
    }

    const permission = await getNotificationPermission();
    if (permission !== 'granted') {
      return;
    }

    const now = Date.now();
    const today = startOfDay(new Date());

    plansRef.current.forEach((plan) => {
      if (plan.color === 'green') {
        return;
      }
      if (!isSameWeek(new Date(plan.date), selectedWeekStart, { weekStartsOn: 1 })) {
        return;
      }
      if (!isSameDay(new Date(plan.date), today)) {
        return;
      }

      const notificationId = makeNotificationId(plan);
      if (firedNotificationIdsRef.current.has(notificationId)) {
        return;
      }

      const eventDate = getEventDate(plan);
      const remindAt = eventDate.getTime() - 15 * 60 * 1000;
      if (eventDate.getTime() <= now) {
        return;
      }

      const minutesUntilStart = (eventDate.getTime() - now) / 60_000;
      if (isWithinReminderWindow(minutesUntilStart)) {
        void sendReminderNotification(plan);
        return;
      }

      if (remindAt > now) {
        scheduleTaskNotification({
          id: notificationId,
          title: buildNotificationTitle(),
          body: buildNotificationBody(plan.title?.trim() || 'công việc'),
          fireAt: remindAt,
        }).catch((error) => {
          console.error('Failed to schedule task notification', error);
        });
      }
    });
  }, [clearAllScheduledNotifications, getEventDate, makeNotificationId, sendReminderNotification, getNotificationPermission, selectedWeekStart, settingsState.notificationsEnabled, isOnline]);

  const scanForMissedNotifications = React.useCallback(() => {
    if (!isOnline || !settingsState.notificationsEnabled || typeof window === 'undefined') {
      return;
    }

    const now = Date.now();
    const today = startOfDay(new Date());

    plansRef.current.forEach((plan) => {
      if (plan.color === 'green') {
        return;
      }
      if (!isSameWeek(new Date(plan.date), selectedWeekStart, { weekStartsOn: 1 })) {
        return;
      }
      if (!isSameDay(new Date(plan.date), today)) {
        return;
      }

      const notificationId = makeNotificationId(plan);
      if (firedNotificationIdsRef.current.has(notificationId)) {
        return;
      }

      const eventDate = getEventDate(plan);
      const minutesUntilStart = (eventDate.getTime() - now) / 60_000;
      if (isWithinReminderWindow(minutesUntilStart)) {
        void sendReminderNotification(plan);
      }
    });
  }, [getEventDate, makeNotificationId, sendReminderNotification, selectedWeekStart, settingsState.notificationsEnabled, isOnline]);

  const startNotifications = React.useCallback(async () => {
    const permission = await getNotificationPermission();
    if (permission !== 'granted') {
      toast.error('Notification permission denied.');
      handleUpdateSettings({ notificationsEnabled: false });
      return;
    }

    await registerNotificationWorker();
    await clearAllScheduledNotifications();
    void scheduleUpcomingNotifications();
    if (notificationScannerRef.current !== null) {
      window.clearInterval(notificationScannerRef.current);
    }
    notificationScannerRef.current = window.setInterval(scanForMissedNotifications, 30_000);
  }, [clearAllScheduledNotifications, getNotificationPermission, registerNotificationWorker, scheduleUpcomingNotifications, scanForMissedNotifications, handleUpdateSettings]);

  React.useEffect(() => {
    if (!settingsState.notificationsEnabled || !isOnline) {
      void clearAllScheduledNotifications();
      return;
    }

    void startNotifications();

    return () => {
      void clearAllScheduledNotifications();
    };
  }, [settingsState.notificationsEnabled, isOnline, clearAllScheduledNotifications, startNotifications]);

  React.useEffect(() => {
    if (!settingsState.notificationsEnabled || !isOnline) {
      return;
    }

    void scheduleUpcomingNotifications();
  }, [plans, settingsState.notificationsEnabled, isOnline, scheduleUpcomingNotifications]);

  const formatSeconds = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const settingsTabs = React.useMemo(() => [
    { value: 'general', label: t('general'), icon: <Settings className="w-4 h-4" /> },
    { value: 'schedule', label: t('schedule'), icon: <CalendarIcon className="w-4 h-4" /> },
    { value: 'sound', label: t('sound'), icon: <Volume2 className="w-4 h-4" /> },
    { value: 'appearance', label: t('appearance'), icon: <Sun className="w-4 h-4" /> },
    { value: 'account', label: t('account'), icon: <CloudIcon className="w-4 h-4" /> },
  ], [t]);

  const desktopFontClass = React.useMemo(() => {
    switch (settingsState.desktopFontSize) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  }, [settingsState.desktopFontSize]);

  const startGymRest = () => {
    const duration = settingsState.gymRestDurationSeconds ?? 60;
    // Resume from paused remaining if available
    if (!gymRestRunning && gymRestEndAt === null && gymRestRemaining && gymRestRemaining < duration) {
      setGymRestEndAt(Date.now() + gymRestRemaining * 1000);
      setGymRestRunning(true);
      setGymRestMessage(t('gymRestNextRound', { nextRound: String(Math.min(gymRestRound + 1, gymRestSets)) }));
      return;
    }
    // Fresh start
    setGymRestRound(1);
    setGymRestEndAt(Date.now() + duration * 1000);
    setGymRestRemaining(duration);
    setGymRestRunning(true);
    setGymRestMessage(t('gymRestNextRound', { nextRound: '2' }));
  };

  const pauseGymRest = () => {
    if (gymRestEndAt === null) return;
    setGymRestRunning(false);
    const remaining = Math.max(0, Math.round((gymRestEndAt - Date.now()) / 1000));
    setGymRestRemaining(remaining);
    setGymRestEndAt(null);
  };

  const resetGymRest = () => {
    setGymRestRunning(false);
    setGymRestEndAt(null);
    setGymRestRound(1);
    setGymRestMessage('');
    setGymRestRemaining(settingsState.gymRestDurationSeconds ?? 60);
  };

  React.useEffect(() => {
    if (!gymRestRunning || gymRestEndAt === null) return;
    const duration = settingsState.gymRestDurationSeconds ?? 60;

    const tick = () => {
      const remaining = Math.max(0, Math.round((gymRestEndAt - Date.now()) / 1000));
      setGymRestRemaining(remaining);
      if (remaining <= 0) {
        if (gymRestRound < gymRestSets) {
          const nextRound = gymRestRound + 1;
          setGymRestRound(nextRound);
          setGymRestRemaining(duration);
          setGymRestEndAt(Date.now() + duration * 1000);
          setGymRestMessage(t('gymRestNextRound', { nextRound: String(nextRound) }));
        } else {
          setGymRestRunning(false);
          setGymRestEndAt(null);
          setGymRestMessage(t('gymRestComplete'));
        }
        if (settingsState.gymRestSoundEnabled) {
          playNotificationSound(settingsState.notificationSound);
        }
        if (settingsState.gymRestVibrationEnabled && navigator.vibrate) {
          navigator.vibrate(300);
        }
      }
    };
    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [gymRestRunning, gymRestEndAt, gymRestRound, gymRestSets, settingsState.gymRestSoundEnabled, settingsState.gymRestVibrationEnabled, settingsState.notificationSound, t]);

  const currentWeekPlans = React.useMemo(() => {
    return plans.filter(p => isSameWeek(new Date(p.date), selectedWeekStart, { weekStartsOn: 1 }));
  }, [plans, selectedWeekStart]);

  // Cat auto-move: find empty schedule cells and teleport the cat there periodically
  React.useEffect(() => {
    if (isMobile || settingsState.catEnabled === false) return;

    let running = true;
    const moveCatToRandomEmptyCell = () => {
      try {
        const tds = Array.from(document.querySelectorAll('table tbody td')) as HTMLElement[];
        const empty = tds.filter(td => !td.classList.contains('sticky') && td.innerText.trim() === '');
        if (empty.length === 0) return;
        const choice = empty[Math.floor(Math.random() * empty.length)];
        const rect = choice.getBoundingClientRect();
        const left = rect.left + rect.width / 2 - 48; // center minus half cat
        const top = rect.top + rect.height / 2 - 48;
        setCatPosition({ left: Math.max(8, left), top: Math.max(8, top) });
      } catch (e) {
        // ignore
      }
    };

    const id = window.setInterval(() => { if (!running) return; moveCatToRandomEmptyCell(); }, 8000);
    // initial placement
    setTimeout(moveCatToRandomEmptyCell, 300);
    const onResize = () => { moveCatToRandomEmptyCell(); };
    window.addEventListener('resize', onResize);
    return () => { running = false; window.clearInterval(id); window.removeEventListener('resize', onResize); };
  }, [currentWeekPlans, isMobile, settingsState.catEnabled]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const activeTab = document.getElementById('active-week-tab');
      const container = document.getElementById('week-tabs-container');
      if (activeTab && container) {
        const scrollPos = activeTab.offsetLeft - (container.offsetWidth / 2) + (activeTab.offsetWidth / 2);
        container.scrollTo({ left: scrollPos, behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedWeekStart]);

  const handleUpdatePlan = React.useCallback((p: Plan) => {
    const oldPlan = plansRef.current.find(x => x.id === p.id);
    if (oldPlan && oldPlan.color !== 'green' && p.color === 'green') {
        void cancelScheduledNotificationById(makeNotificationId(p));

      const motivators = [t('motivate1'), t('motivate2'), t('motivate3'), t('motivate4'), t('motivate5')];
      const message = motivators[Math.floor(Math.random() * motivators.length)];
      toast.success(message, {
        icon: <Trophy className="w-4 h-4 text-yellow-500" />,
        duration: 3000
      });
      setShowCelebration(true);
      showSpeechBubbleText('complete', p.title || 'nhiệm vụ', p.id);
    }

    setPlans((prev) => {
      const next = prev.map(x => x.id === p.id ? p : x);
      storage.savePlans(next, user?.uid);
      return next;
    });

    if (user) {
      cloudStorage.savePlan(user.uid, p)
        .then(() => {
          storage.setPendingSync(user.uid, 'plans', false);
        })
        .catch((error) => {
          storage.setPendingSync(user.uid, 'plans', true);
          console.warn('Cloud save failed, local change persisted:', error);
        });
    }
  }, [user, settingsState.notificationSound, t, showSpeechBubbleText]);

  const handleAddPlan = React.useCallback((p: Plan) => {
    setPlans((prev) => {
      const next = [...prev, p];
      storage.savePlans(next, user?.uid);
      return next;
    });

    if (user) {
      cloudStorage.savePlan(user.uid, p)
        .then(() => {
          storage.setPendingSync(user.uid, 'plans', false);
        })
        .catch((error) => {
          storage.setPendingSync(user.uid, 'plans', true);
          console.warn('Cloud save failed, local change persisted:', error);
        });
    }
  }, [user]);

  const handleDeletePlan = React.useCallback((id: string) => {
    setPlans((prev) => {
      const next = prev.filter(x => x.id !== id);
      storage.deletePlan(id, user?.uid);
      return next;
    });

    if (user) {
      cloudStorage.deletePlan(user.uid, id)
        .then(() => {
          storage.setPendingSync(user.uid, 'plans', false);
          storage.clearSyncedDeletedPlans(user.uid, true);
        })
        .catch((error) => {
          storage.setPendingSync(user.uid, 'plans', true);
          console.warn('Cloud delete failed, local change persisted:', error);
        });
    }

    void cancelScheduledNotificationById(id);
  }, [user]);

  const handlePlanTurnGreen = React.useCallback((p: Plan) => {
    setCatMoodOverride('celebrating');
    playNotificationSound(settingsState.notificationSound);
    if (settingsState.catEnabled !== false) {
      playMeow();
    }
    setShowCelebration(true);
    window.setTimeout(() => setCatMoodOverride(null), 3000);
  }, [settingsState.catEnabled, settingsState.notificationSound]);

  const totalPlansCount = currentWeekPlans.length;
  const completedPlansCount = currentWeekPlans.filter(p => p.color === 'green').length;

  const weekTabs = React.useMemo(() => {
    const today = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 21 }, (_, i) => addWeeks(today, i - 10));
  }, []);

  // Determine cat mood based on current state
  const getCatMood = React.useCallback((): CatMood => {
    if (pomodoroRunning) {
      if (pomodoroMode === 'work') return 'gym';
      if (pomodoroMode === 'short') return 'shortBreak';
      if (pomodoroMode === 'long') return 'longBreak';
    }
    
    if (isSettingsOpen) return 'work';
    if (isSummaryOpen) return 'celebrating';
    
    if (completedPlansCount === totalPlansCount && totalPlansCount > 0) {
      return 'celebrating';
    }
    
    if (completedPlansCount > totalPlansCount * 0.7 && totalPlansCount > 0) {
      return 'happy';
    }
    
    if (completedPlansCount === 0 && totalPlansCount > 0) {
      return 'tired';
    }
    
    return 'idle';
  }, [pomodoroRunning, pomodoroMode, isSettingsOpen, isSummaryOpen, completedPlansCount, totalPlansCount]);

  const catMood = getCatMood();

  // Test hook: expose a global helper to open Settings from integration tests
  React.useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (typeof window !== 'undefined') window.__openSettings = () => setIsSettingsOpen(true);
    } catch (e) {
      // ignore
    }
    return () => {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (typeof window !== 'undefined' && window.__openSettings) delete window.__openSettings;
      } catch (e) {}
    };
  }, []);

  // Build background style
  const getBackgroundStyle = React.useCallback((): React.CSSProperties => {
    if (!settingsState.backgroundConfig) {
      return {};
    }

    const { type, value, opacity = 1 } = settingsState.backgroundConfig;

    if (type === 'color') {
      return { backgroundColor: value, opacity };
    } else if (type === 'gradient') {
      return { background: value, opacity };
    } else if (type === 'image') {
      return {
        backgroundImage: `url(${value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity,
      };
    }

    return {};
  }, [settingsState.backgroundConfig]);

  // Keyboard and touch navigation for week switching
  React.useEffect(() => {
    let touchStartX = 0;
    let scrollContainerStartX = 0;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Left arrow = previous week, Right arrow = next week
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedWeekStart(subWeeks(selectedWeekStart, 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedWeekStart(addWeeks(selectedWeekStart, 1));
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      const scrollContainer = document.getElementById('schedule-scroll-container');
      scrollContainerStartX = scrollContainer?.scrollLeft ?? 0;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      const threshold = 50; // minimum swipe distance in pixels

      if (Math.abs(diff) > threshold) {
        const scrollContainer = document.getElementById('schedule-scroll-container');
        
        if (scrollContainer) {
          const scrollContainerEndX = scrollContainer.scrollLeft;
          
          // If scroll position changed, browser handled the horizontal scroll - don't switch weeks
          if (scrollContainerEndX !== scrollContainerStartX) {
            return;
          }
        }

        if (diff > 0) {
          // Swipe left = next week
          setSelectedWeekStart(addWeeks(selectedWeekStart, 1));
        } else {
          // Swipe right = previous week
          setSelectedWeekStart(subWeeks(selectedWeekStart, 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [selectedWeekStart]);

  return (
    <div 
      className={cn(
        "h-screen flex flex-col transition-colors duration-300 overflow-hidden relative",
        settingsState.theme === 'dark' && "dark",
        "bg-background text-foreground",
        settingsState.language === 'vi' ? 'font-vietnamese' : 'font-sans'
      )}
      style={getBackgroundStyle()}
    >
      {/* Background overlay for better text readability */}
      {settingsState.backgroundConfig && (
        <div className="absolute inset-0 bg-background/40 dark:bg-background/60 pointer-events-none" />
      )}

      <header className="border-b sticky top-0 z-50 bg-background/95 dark:bg-background/95 backdrop-blur border-border relative">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Logo className="w-8 h-8" />
             <h1 className="text-lg font-black">{t('appName')}</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
             {!user && !authLoading && (
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="flex border-[#107C41] text-[#107C41] hover:bg-[#107C41]/5 font-bold h-9 px-2 sm:px-3"
                 onClick={async () => {
                   playMusicalNote();
                   setLoginLoading(true);
                   try {
                     await signInWithGoogle();
                   } catch (e) {
                     console.error(e);
                   } finally {
                     setLoginLoading(false);
                   }
                 }}
                 disabled={loginLoading}
               >
                 {loginLoading ? <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" /> : <LogIn className="w-4 h-4 sm:mr-2" />}
                 <span className="hidden sm:inline">{t('signIn')}</span>
                 <span className="sm:hidden text-[11px] font-bold">{t('login')}</span>
               </Button>
             )}
             <Button
               variant="ghost"
               size="icon"
               className="h-9 w-9 shrink-0"
               onClick={() => {
                 playMusicalNote();
                 handleUpdateSettings({ notificationsEnabled: !settingsState.notificationsEnabled });
               }}
               title={settingsState.notificationsEnabled ? 'Tắt nhắc nhở thông minh' : 'Bật nhắc nhở thông minh'}
               aria-label={settingsState.notificationsEnabled ? 'Disable smart reminders' : 'Enable smart reminders'}
             >
               {settingsState.notificationsEnabled ? <Bell className="w-4 h-4 text-[#107C41]" /> : <BellOff className="w-4 h-4" />}
             </Button>

             <Popover>
               <PopoverTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => playMusicalNote()}>
                    <Music className={cn("w-4 h-4 transition-all", isMusicPlaying && "text-[#107C41] animate-spin-slow")} />
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-80 p-4" align="end">
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <h3 className="font-bold text-sm uppercase tracking-wider">{t('music')}</h3>
                     <span className="text-[10px] text-muted-foreground">{t('playlist')}</span>
                   </div>

                   <div className="flex items-center gap-2">
                     <Button variant="outline" size="icon" className="h-9 w-9" onClick={playPreviousTrack}>
                       <RotateCcw className="w-4 h-4 rotate-180" />
                     </Button>
                     <Button variant="secondary" size="icon" className="h-10 w-10" onClick={toggleMusic}>
                       {isMusicPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                     </Button>
                     <Button variant="outline" size="icon" className="h-9 w-9" onClick={playNextTrack}>
                       <RotateCcw className="w-4 h-4" />
                     </Button>
                   </div>

                   <div className="space-y-2">
                     <div className="flex items-center justify-between">
                       <span className="text-xs font-semibold">{t('playbackMode')}</span>
                       <Select value={musicPlaybackMode} onValueChange={(value: MusicPlaybackMode) => {
                         setMusicPlaybackMode(value);
                         if (selectedMusicId) {
                           persistMusicState(selectedMusicId, value, isMusicPlaying);
                         }
                         handleUpdateSettings({ musicPlaybackMode: value });
                       }}>
                         <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="play_once">{t('playOnce')}</SelectItem>
                           <SelectItem value="loop_one">{t('loopOne')}</SelectItem>
                           <SelectItem value="loop_all">{t('loopAll')}</SelectItem>
                           <SelectItem value="shuffle">{t('shuffle')}</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>

                     <div className="space-y-1">
                       <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                         <span>{t('sound')}</span>
                         <span>{Math.round((settingsState.musicVolume ?? 0.3) * 100)}%</span>
                       </div>
                       <Slider value={[settingsState.musicVolume ?? 0.3]} onValueChange={(value: number[]) => {
                         const nextVolume = value[0];
                         handleUpdateSettings({ musicVolume: nextVolume });
                         if (audioRef.current) {
                           audioRef.current.volume = nextVolume;
                         }
                         persistMusicState(selectedMusicId, musicPlaybackMode, isMusicPlaying);
                       }} min={0} max={1} step={0.01} />
                     </div>
                   </div>

                   <div className="max-h-44 overflow-auto rounded-xl border border-border p-2 space-y-1">
                     {playlistTracks.map((track) => (
                       <button
                         key={track.id}
                         className={cn(
                           'flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs transition-colors',
                           selectedMusicId === track.id ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted'
                         )}
                         onClick={() => {
                           playTrack(track.id, true);
                         }}
                       >
                         <span className="truncate pr-2">{track.name}</span>
                         <span className="text-[10px] text-muted-foreground">{track.isCustom ? '★' : '•'}</span>
                       </button>
                     ))}
                   </div>

                   <div className="space-y-2 rounded-xl border border-dashed border-border p-3 text-[11px]">
                     <div className="flex items-center justify-between text-xs font-semibold">
                       <span>{t('customMusic')}</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <Input value={musicInputUrl} onChange={(event) => setMusicInputUrl(event.target.value)} placeholder={t('enterMusicUrl')} className="h-8 text-[11px]" />
                       <Button variant="outline" size="sm" className="h-8" onClick={handleAddMusicUrl} disabled={isMusicLoading}>
                         {t('addMusicUrl')}
                       </Button>
                     </div>
                     <p className="text-[10px] text-muted-foreground">{t('customTrackHint')}</p>
                     {musicError ? <p className="text-[10px] text-red-500">{musicError}</p> : null}
                   </div>

                   <div className="flex items-center justify-between">
                     <span className="text-[10px] text-muted-foreground">{selectedMusicId ? t('musicTrack') : t('noCustomTracks')}</span>
                     {selectedMusicId && (
                       <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => playTrack(null, false)}>
                         {t('removeMusic')}
                       </Button>
                     )}
                   </div>
                 </div>
               </PopoverContent>
             </Popover>

             <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-[#FF6B00]" onClick={() => {
                playMusicalNote();
                // Toggle gym panel: second press closes it
                if (gymRestOpen) {
                  setGymRestOpen(false);
                  setCatMoodOverride(null);
                  return;
                }
                if (!settingsState.gymRestEnabled) {
                  handleUpdateSettings({ gymRestEnabled: true });
                }
                setGymRestOpen(true);
                // set cat to gym mood briefly
                setCatMoodOverride('gym');
                setTimeout(() => setCatMoodOverride(null), 5000);
              }}>
                <Dumbbell className="w-4 h-4" />
             </Button>
             <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => {
                playMusicalNote();
                setIsSettingsOpen(true);
              }}>
                <Settings className="w-4 h-4" />
             </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth relative z-10" id="main-scroll-container">
        <div className="container mx-auto max-w-7xl">
           <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                 <h2 className="text-2xl font-black">{t('weekOf')} {format(selectedWeekStart, 'w')}</h2>
                 <p className="text-sm opacity-60">{format(selectedWeekStart, 'd MMMM')} - {format(addWeeks(selectedWeekStart, 1), 'd MMMM')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="hidden lg:flex" onClick={() => setIsSummaryOpen(true)}>
                  <Trophy className="w-3.5 h-3.5 mr-2 text-yellow-600" />
                  {t('summaryButton')}
                </Button>
              </div>
           </div>

           <div className="bg-card dark:border-white/10 rounded-xl border shadow-xl overflow-hidden">
             <AnimatePresence mode="wait">
               <motion.div
                 key={format(selectedWeekStart, 'yyyy-MM-dd')}
                 initial={actualWeekTransitionEffect === 'slide'
                   ? { opacity: 0, x: weekTransitionDirection === 'forward' ? 40 : -40 }
                   : actualWeekTransitionEffect === 'fade'
                     ? { opacity: 0 }
                     : { opacity: 1, x: 0 }
                 }
                 animate={{ opacity: 1, x: 0 }}
                 exit={actualWeekTransitionEffect === 'slide'
                   ? { opacity: 0, x: weekTransitionDirection === 'forward' ? -40 : 40 }
                   : actualWeekTransitionEffect === 'fade'
                     ? { opacity: 0 }
                     : { opacity: 1, x: 0 }
                 }
                 transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                 className="overflow-hidden"
               >
                 <ScheduleGrid 
                    currentWeekStart={selectedWeekStart}
                    plans={currentWeekPlans}
                    onAddPlan={handleAddPlan}
                    onUpdatePlan={handleUpdatePlan}
                    onDeletePlan={handleDeletePlan}
                    onPlanTurnGreen={handlePlanTurnGreen}
                    language={settingsState.language}
                    theme={settingsState.theme}
                    startHour={settingsState.startHour}
                    endHour={settingsState.endHour}
                    showLunarCalendar={settingsState.showLunarCalendar ?? true}
                 />
                 <div className="p-4 border-t bg-muted/30">
               <Label className="text-[10px] font-bold uppercase mb-2 block opacity-50">{t('weekNote')}</Label>
               <WeekNoteEditor 
                  weekStart={selectedWeekStart}
                  initialNote={weekMetas[format(selectedWeekStart, 'yyyy-MM-dd')]?.note || ''}
                  theme={settingsState.theme}
                  placeholder={t('weekNotePlaceholder')}
                  btnSaveText={t('saveNote')}
                  btnSavedText={t('saved')}
                  onSave={(note) => {
                    const key = format(selectedWeekStart, 'yyyy-MM-dd');
                    const updated = { ...weekMetas, [key]: { ...weekMetas[key], note } };
                    setWeekMetas(updated);
                    storage.saveWeekMeta(key, { note }, user?.uid);
                    if (user) {
                      cloudStorage.saveWeekMeta(user.uid, key, { note })
                        .then(() => storage.setPendingSync(user.uid, 'week_meta', false))
                        .catch(() => storage.setPendingSync(user.uid, 'week_meta', true));
                    }
                  }}
               />
             </div>

             {/* Copyright Footer - inside the card */}
             <div className="border-t bg-muted/20 p-3 text-center">
               <p className="text-xs text-gray-600 dark:text-gray-300">Được tạo ra bởi ThànhBicycle</p>
               <p className="text-xs text-gray-600 dark:text-gray-300">Created by ThànhBicycle</p>
             </div>
           </motion.div>
         </AnimatePresence>
           </div>

           <div className="mt-8 flex justify-between items-center bg-[#107C41] text-white p-6 rounded-xl">
              <div>
                 <h3 className="font-bold">{t('weeklyProgress')}</h3>
                 <p className="text-sm opacity-80">{completedPlansCount}/{totalPlansCount} {t('tasksCompleted')}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 opacity-20" />
           </div>
        </div>
      </main>

      <footer className="p-2 border-t sticky bottom-0 z-50 bg-background/95 border-border backdrop-blur relative">
         <div className="container mx-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSelectedWeekStart(subWeeks(selectedWeekStart, 1))}><ChevronLeft className="w-4 h-4"/></Button>
            <div className="flex-1 overflow-x-auto flex gap-1 scroll-smooth" id="week-tabs-container">
              {weekTabs.map((ws, i) => {
                const isActive = isSameWeek(ws, selectedWeekStart, { weekStartsOn: 1 });
                const key = format(ws, 'yyyy-MM-dd');
                const meta = weekMetas[key] || {};
                const colorValue = meta.color || 'bg-muted dark:bg-muted';
                
                return (
                  <React.Fragment key={i}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          id={isActive ? "active-week-tab" : undefined}
                          className={cn(
                            "px-4 py-1.5 text-[11px] font-bold rounded-xl whitespace-nowrap transition-all border shrink-0",
                            isActive 
                              ? "bg-[#107C41] text-white shadow-lg scale-105 border-[#107C41]" 
                              : cn("text-muted-foreground border-border hover:border-primary/30", colorValue)
                          )}
                          onClick={() => setSelectedWeekStart(ws)}
                        >
                          {t('week')} {format(ws, 'w')}
                          {meta.note && <span className="ml-1 opacity-50">✎</span>}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-4 space-y-4 rounded-2xl shadow-2xl border bg-popover" side="top" align="center" sideOffset={10}>
                         <div className="space-y-3">
                            <div className="flex items-center justify-between">
                               <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">{t('weekColor')}</Label>
                               {meta.color && (
                                  <Button variant="ghost" size="sm" className="h-6 text-[9px]" onClick={() => {
                                     const updated = { ...weekMetas, [key]: { ...weekMetas[key], color: undefined } };
                                     setWeekMetas(updated);
                                     storage.saveWeekMeta(key, { color: null }, user?.uid);
                                     if (user) {
                                       cloudStorage.saveWeekMeta(user.uid, key, { color: null })
                                         .then(() => storage.setPendingSync(user.uid, 'week_meta', false))
                                         .catch(() => storage.setPendingSync(user.uid, 'week_meta', true));
                                     }
                                  }}>Reset</Button>
                               )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                               {WEEK_COLORS.map(c => (
                                  <button
                                     key={c.value}
                                     onClick={() => {
                                        const updated = { ...weekMetas, [key]: { ...weekMetas[key], color: c.value } };
                                        setWeekMetas(updated);
                                        storage.saveWeekMeta(key, { color: c.value }, user?.uid);
                                        if (user) {
                                          cloudStorage.saveWeekMeta(user.uid, key, { color: c.value })
                                            .then(() => storage.setPendingSync(user.uid, 'week_meta', false))
                                            .catch(() => storage.setPendingSync(user.uid, 'week_meta', true));
                                        }
                                     }}
                                     className={cn(
                                        "w-7 h-7 rounded-lg border-2 transition-all hover:scale-110",
                                        c.value,
                                        meta.color === c.value ? "ring-2 ring-offset-2 ring-[#107C41] border-white" : "border-transparent"
                                     )}
                                     title={c.name}
                                  />
                               ))}
                            </div>
                         </div>
                         
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">{t('weekNote')}</Label>
                            <Textarea 
                               value={meta.note || ''}
                               onChange={(e) => {
                                  const updated = { ...weekMetas, [key]: { ...weekMetas[key], note: e.target.value } };
                                  setWeekMetas(updated);
                                  storage.saveWeekMeta(key, { note: e.target.value }, user?.uid);
                                  if (user) {
                                    cloudStorage.saveWeekMeta(user.uid, key, { note: e.target.value })
                                      .then(() => storage.setPendingSync(user.uid, 'week_meta', false))
                                      .catch(() => storage.setPendingSync(user.uid, 'week_meta', true));
                                  }
                               }}
                               placeholder={t('weekNotePlaceholder')}
                               className="text-xs min-h-[100px] resize-none rounded-xl bg-muted/50 border-border"
                            />
                         </div>
                         
                         <div className="flex gap-2">
                            <Button size="sm" className="flex-1 bg-[#107C41] hover:bg-[#0d6435] text-white rounded-xl shadow-lg border-none" onClick={() => {
                               const updated = { ...weekMetas, [key]: { ...weekMetas[key] } };
                               setWeekMetas(updated);
                               storage.saveWeekMeta(key, updated[key], user?.uid);
                               if (user) {
                                 cloudStorage.saveWeekMeta(user.uid, key, updated[key])
                                   .then(() => storage.setPendingSync(user.uid, 'week_meta', false))
                                   .catch(() => storage.setPendingSync(user.uid, 'week_meta', true));
                               }
                            }}>
                               {t('save')}
                            </Button>
                         </div>
                      </PopoverContent>
                    </Popover>
                  </React.Fragment>
                );
              })}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedWeekStart(addWeeks(selectedWeekStart, 1))}><ChevronRight className="w-4 h-4"/></Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="link" size="sm">
                  <CalendarIcon className="w-4 h-4 mr-2 sm:inline hidden" />
                  {t('today')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 flex flex-col" align="end" side="top">
                <CalendarUI
                  mode="single"
                  selected={selectedWeekStart}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
                    }
                  }}
                  initialFocus
                />
                <div className="p-3 border-t bg-muted/50">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full text-[11px] font-bold h-7 rounded-lg"
                    onClick={() => {
                      const now = new Date();
                      setSelectedWeekStart(startOfWeek(now, { weekStartsOn: 1 }));
                      setIsCalendarOpen(false);
                    }}
                  >
                    {t('currentDay')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
         </div>
      </footer>

      {/* Floating UI Group */}
      <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none">
        {isMobileNote ? (
          <AnimatePresence>
            {isNoteOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                  onClick={() => setIsNoteOpen(false)}
                />
                <motion.div
                  initial={{ y: 200, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 200, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-xl rounded-t-3xl border border-border bg-card p-4 shadow-2xl shadow-black/10 pointer-events-auto"
                >
                  <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-muted-foreground/40" />
                  <div className="flex items-center justify-between gap-3 pb-3">
                    <div>
                      <p className="text-sm font-bold">Ghi chú nhanh</p>
                      <p className="text-[11px] opacity-70">Lưu tự động, không lo mất dữ liệu khi tải lại</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNoteOpen(false)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-muted/80 text-foreground transition hover:bg-muted"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Ghi gì đó..."
                    rows={10}
                    className="min-h-[14rem] resize-none bg-muted/70 border-border"
                  />
                  <Button
                    className="mt-4 h-11 w-full rounded-2xl bg-[#107C41] text-white shadow-lg shadow-[#107C41]/20 hover:bg-[#0d6435]"
                    onClick={() => setIsNoteOpen(false)}
                  >
                    Đóng
                  </Button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        ) : null}

        <div className="fixed bottom-12 right-4 z-[9999] flex flex-col items-end gap-3 pointer-events-auto">
          <QuickNoteEditor isMobile={isMobileNote} isOpen={isNoteOpen} onOpenChange={setIsNoteOpen} />

          <HealthTipPanel theme={settingsState.theme} isSettingsOpen={isSettingsOpen} t={t} lang={settingsState.language} onActivate={(m) => { setCatMoodOverride(m); setTimeout(() => setCatMoodOverride(null), 4000); }} />

          {/* Pomodoro button grouped with other floating controls */}
          <div className="relative inline-block pointer-events-auto">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setIsPomodoroOpen(v => !v)}
              className={cn(
                "w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95",
                pomodoroRunning ? "animate-pulse bg-red-500" : "bg-[#107C41]"
              )}
              title={t('pomodoro')}
            >
              <Timer className="w-6 h-6 text-white" />
            </button>

            <AnimatePresence>
              {isPomodoroOpen && (
                <motion.div
                  drag
                  dragMomentum={false}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute z-40 w-64 right-0 bottom-14 border shadow-2xl rounded-xl overflow-hidden cursor-move bg-card"
                >
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-sm uppercase tracking-wider">{t('pomodoro')}</h3>
                      <Badge variant="outline">{pomodoroSessions} {t('sessions')}</Badge>
                    </div>
                    
                    <div className={cn(
                      "text-center py-6 rounded-2xl transition-colors duration-500",
                      pomodoroMode === 'work' 
                        ? "bg-red-500/10 text-red-600 dark:text-red-400" 
                        : "bg-teal-500/10 text-teal-600 dark:text-teal-400"
                    )}>
                      <div className="text-5xl font-black font-mono tracking-tighter">
                        {Math.floor(pomodoroSecondsLeft / 60).toString().padStart(2, '0')}:
                        {(pomodoroSecondsLeft % 60).toString().padStart(2, '0')}
                      </div>
                      <p className="text-[10px] uppercase opacity-70 mt-1 font-bold tracking-widest">{t(pomodoroMode as any)}</p>
                    </div>

                    <div className="flex gap-1.5 p-1 bg-muted rounded-xl">
                      {(['work', 'short', 'long'] as PomodoroMode[]).map(m => (
                        <Button 
                          key={m}
                          variant={pomodoroMode === m ? 'secondary' : 'ghost'} 
                          size="xs" 
                          className={cn(
                            "flex-1 text-[10px] rounded-lg transition-all",
                            pomodoroMode === m && (
                              pomodoroMode === 'work' 
                                ? "bg-background text-red-600 shadow-sm" 
                                : "bg-background text-teal-600 shadow-sm"
                            )
                          )}
                          onClick={() => switchPomodoroMode(m)}
                        >
                          {t(m === 'work' ? 'work' : m === 'short' ? 'shortBreak' : 'longBreak' as any)}
                        </Button>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        className={cn(
                          "flex-1 h-10 rounded-xl font-bold transition-all",
                          pomodoroRunning 
                            ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" 
                            : (pomodoroMode === 'work' ? "bg-red-600 hover:bg-red-700 text-white" : "bg-teal-600 hover:bg-teal-700 text-white")
                        )}
                        onClick={togglePomodoro}
                      >
                        {pomodoroRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                        {pomodoroRunning ? t('pause') : t('start')}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl"
                        onClick={resetPomodoro}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          
        </div>
        {gymRestOpen && (
          <AnimatePresence>
            <motion.div
              drag
              dragMomentum={false}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onPointerDown={(e) => e.stopPropagation()}
              className="fixed bottom-24 right-4 z-40 w-[min(95vw,22rem)] border shadow-2xl rounded-3xl overflow-hidden cursor-move bg-card border-border pointer-events-auto"
            >
              <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest">{t('gymRestTimer')}</h3>
                      <p className="text-[10px] opacity-90">{t('gymRestDuration')} {formatSeconds(settingsState.gymRestDurationSeconds ?? 60)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateSettings({ gymRestSoundEnabled: !settingsState.gymRestSoundEnabled })}
                        className={cn(
                          "inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/20 bg-white/10 transition",
                          settingsState.gymRestSoundEnabled ? 'text-white' : 'text-white/70'
                        )}
                        title={t('gymRestSound')}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateSettings({ gymRestVibrationEnabled: !settingsState.gymRestVibrationEnabled })}
                        className={cn(
                          "inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/20 bg-white/10 transition",
                          settingsState.gymRestVibrationEnabled ? 'text-white' : 'text-white/70'
                        )}
                        title={t('gymRestVibration')}
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      <X className="w-4 h-4 cursor-pointer" onClick={() => setGymRestOpen(false)} />
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {[30, 45, 60, 90, 120].map((sec) => (
                        <Button
                          key={sec}
                          size="sm"
                          variant={settingsState.gymRestDurationSeconds === sec ? 'secondary' : 'outline'}
                          className="h-9 rounded-2xl text-xs font-bold"
                          onClick={() => handleUpdateSettings({ gymRestDurationSeconds: sec })}
                        >
                          {sec}s
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        variant={gymRestCustomOpen ? 'secondary' : 'outline'}
                        className="h-9 rounded-2xl text-xs font-bold col-span-3"
                        onClick={() => setGymRestCustomOpen((v) => !v)}
                      >
                        {t('custom')} ⚙️
                      </Button>
                    </div>

                    {gymRestCustomOpen && (
                      <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                        <Input
                          type="number"
                          min={5}
                          max={600}
                          value={settingsState.gymRestDurationSeconds ?? 60}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            handleUpdateSettings({ gymRestDurationSeconds: value });
                            if (!gymRestRunning) setGymRestRemaining(value);
                          }}
                          className="h-11 rounded-2xl border border-border bg-muted/70 text-center"
                        />
                        <span className="text-xs text-muted-foreground">{t('seconds')}</span>
                      </div>
                    )}

                    <div className="rounded-[32px] border border-border bg-background p-5 text-center">
                      <div className="text-[3rem] font-black leading-none tracking-tight text-[#FF6B00]">
                        {formatSeconds(gymRestRemaining)}
                      </div>
                      <p className="text-xs uppercase opacity-70 mt-2 tracking-[0.3em]">{t('gymRestTimer')}</p>
                      <p className="text-sm font-bold mt-3">{t('setProgress', { current: String(gymRestRound), total: String(gymRestSets) })}</p>
                      <p className="text-[11px] opacity-70 mt-1">{t('gymRestNextRound', { nextRound: String(Math.min(gymRestRound + 1, gymRestSets)) })}</p>
                    </div>

                    <div className="grid gap-2">
                      <Button
                        className={cn(
                          "h-12 rounded-2xl text-sm font-bold",
                          gymRestRunning ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-[#FF6B00] text-white hover:bg-[#ff7f2f]'
                        )}
                        onClick={() => {
                          if (gymRestRunning) pauseGymRest();
                          else startGymRest();
                        }}
                      >
                        {gymRestRunning ? <><Pause className="w-4 h-4 mr-2 inline" />{t('pause')}</> : <><Play className="w-4 h-4 mr-2 inline" />{t('start')}</>}
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 h-12 rounded-2xl" onClick={resetGymRest}>{t('reset')}</Button>
                        <Button variant="ghost" className="flex-1 h-12 rounded-2xl" onClick={() => setGymRestOpen(false)}>{t('close')}</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        )}
        
        {/* Celebration Cat - Fixed position */}
        {settingsState.catEnabled !== false && (
          <div className="fixed top-20 right-4 z-50 pointer-events-none">
            <div className="relative">
              {speechBubble && (
                <div className="absolute top-1/2 right-full mr-3 -translate-y-1/2">
                  <SpeechBubbleOverlay
                    text={speechBubble.text}
                    duration={5000}
                    className=""
                    onClose={() => setSpeechBubble(null)}
                  />
                </div>
              )}
              <motion.div
                initial={{ scale: 1 }}
                animate={catMoodOverride === 'celebrating' ? { scale: [1, 1.15, 0.95, 1.1, 1], rotate: [0, -10, 10, -8, 0] } : { scale: 1, rotate: 0 }}
                transition={{ duration: 2.5, ease: 'easeInOut' }}
                className="pointer-events-auto"
              >
                <DynamicCat 
                  mood={catMoodOverride ?? catMood}
                  color={settingsState.catColor ?? 'orange'}
                  size="sm"
                  onClick={() => {
                    playMusicalNote();
                    setCatMoodOverride('celebrating');
                    if (settingsState.catEnabled !== false) {
                      playMeow();
                    }
                    setTimeout(() => setCatMoodOverride(null), 3000);
                  }}
                />
              </motion.div>
            </div>
          </div>
        )}
        
      </div>

      {!isMobile && <CelebrationEffect trigger={showCelebration} count={25} />}
      <Toaster />

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
         <DialogContent className={cn(
           "w-full max-w-[calc(100vw-64px)] md:max-w-6xl h-[90vh] rounded-[32px] bg-card dark:bg-card p-0 flex flex-col",
           desktopFontClass
         )}>
            <SettingsErrorBoundary
              onError={(message) => setSettingsError(message)}
              fallback={
                <div className="flex min-h-[20rem] items-center justify-center p-6">
                  <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
                    <p className="text-sm font-semibold text-red-800">Failed to load settings.</p>
                    <p className="mt-2 text-xs text-red-700">{settingsError || 'Please refresh the page.'}</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSettingsError(null);
                        setSettings(normalizeSettings(storage.getSettings()));
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              }
            >
              <div className="flex h-[90vh] min-h-0 flex-col rounded-[32px] bg-card shadow-xl sm:flex-row">
                <aside className="w-full sm:w-[180px] md:w-[220px] max-h-[25vh] sm:max-h-none p-3 sm:p-4 md:p-5 sm:border-r bg-muted/50 dark:bg-muted/20 overflow-y-auto flex-shrink-0">
                  <DialogHeader className="p-0">
                    <DialogTitle className="text-sm md:text-base dark:text-white">{t('settings')}</DialogTitle>
                  </DialogHeader>
                  <p className="mt-1 text-[11px] text-muted-foreground dark:text-foreground/70 line-clamp-2">{t('appDescription')}</p>

                  <div className="mt-3 grid gap-1.5">
                    {settingsTabs.map((tab) => (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => { setActiveSettingsTab(tab.value); setMobileExpanded(null); }}
                        className={cn(
                          "group flex items-center justify-between rounded-xl border border-transparent bg-background dark:bg-muted/30 px-2.5 py-2 text-xs font-medium text-foreground dark:text-foreground transition hover:border-border hover:bg-muted dark:hover:bg-muted/50 gap-1.5",
                          activeSettingsTab === tab.value && "bg-[#F8F9FD] dark:bg-[#107C41] text-foreground dark:text-white shadow-sm"
                        )}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="w-4 h-4 flex-shrink-0">{tab.icon}</span>
                          <span className="truncate text-[11px] md:text-xs">{tab.label}</span>
                        </span>
                        <ChevronRight className={cn(
                          "w-3 h-3 text-muted-foreground dark:text-muted-foreground/70 flex-shrink-0 transition-transform duration-200",
                          activeSettingsTab === tab.value ? "rotate-90 dark:text-white" : ""
                        )} />
                      </button>
                    ))}
                  </div>
                </aside>

                <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 min-h-0 flex justify-center">
                  <div className="w-full max-w-2xl">
                  {activeSettingsTab === 'general' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-border bg-muted/60 dark:bg-muted/30 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold dark:text-white">{t('language')}</p>
                            <p className="text-xs text-muted-foreground dark:text-foreground/70">{t('language')}</p>
                          </div>
                          <Select value={settingsState.language} onValueChange={(v: Language) => handleUpdateSettings({ language: v })}>
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="vi">Tiếng Việt</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-muted/60 dark:bg-muted/30 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold dark:text-white">{t('theme')}</p>
                            <p className="text-xs text-muted-foreground dark:text-foreground/70">{t('theme')}</p>
                          </div>
                          <div className="flex items-center gap-2 rounded-full bg-background p-1">
                            <Button variant={settingsState.theme === 'light' ? 'secondary' : 'ghost'} size="xs" onClick={() => handleUpdateSettings({ theme: 'light' })}>
                              <Sun className="w-3 h-3" />
                            </Button>
                            <Button variant={settingsState.theme === 'dark' ? 'secondary' : 'ghost'} size="xs" onClick={() => handleUpdateSettings({ theme: 'dark' })}>
                              <Moon className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-muted/60 dark:bg-muted/30 p-4 space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold dark:text-white">{t('cat')}</p>
                            <p className="text-xs text-muted-foreground dark:text-foreground/70">{t('enableCat')}</p>
                          </div>
                          <Switch
                            checked={settingsState.catEnabled !== false}
                            onCheckedChange={(checked) => handleUpdateSettings({ catEnabled: checked })}
                          />
                        </div>
                        {settingsState.catEnabled !== false && (
                          <div className="space-y-3">
                            <p className="text-sm font-semibold dark:text-white">{t('catColor')}</p>
                            <p className="text-xs text-muted-foreground dark:text-foreground/70">{t('catColorDescription')}</p>
                            <div className="flex flex-wrap gap-2">
                              {(['orange', 'pink', 'blue', 'green', 'purple', 'yellow', 'teal', 'red', 'gray', 'black', 'white'] as CatColor[]).map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => handleUpdateSettings({ catColor: color })}
                                  className={cn(
                                    'h-9 w-9 rounded-full border-2 transition-transform duration-200 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                                    settingsState.catColor === color ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105'
                                  )}
                                  style={{
                                    backgroundColor:
                                      color === 'orange' ? '#f59e0b' :
                                      color === 'pink' ? '#ec4899' :
                                      color === 'blue' ? '#3b82f6' :
                                      color === 'green' ? '#22c55e' :
                                      color === 'purple' ? '#8b5cf6' :
                                      color === 'yellow' ? '#fde047' :
                                      color === 'teal' ? '#14b8a6' :
                                      color === 'red' ? '#ef4444' :
                                      color === 'gray' ? '#6b7280' :
                                      color === 'black' ? '#111827' :
                                      '#f8fafc'
                                  }}
                                  aria-label={`Select ${color} cat`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === 'schedule' && (
                    <div className="rounded-2xl border border-border bg-muted/60 dark:bg-muted/30 p-4 md:p-6 space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-foreground dark:text-white">{t('startHour')}</span>
                        <div className="flex items-center gap-3">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-background" onClick={() => { if (settingsState.startHour > 0) handleUpdateSettings({ startHour: settingsState.startHour - 1 }); }}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-12 text-center font-black text-[#107C41]">{settingsState.startHour}h</span>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-background" onClick={() => { if (settingsState.startHour < settingsState.endHour - 1) handleUpdateSettings({ startHour: settingsState.startHour + 1 }); }}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-foreground dark:text-white">{t('endHour')}</span>
                        <div className="flex items-center gap-3">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-background" onClick={() => { if (settingsState.endHour > settingsState.startHour + 1) handleUpdateSettings({ endHour: settingsState.endHour - 1 }); }}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-12 text-center font-black text-[#107C41]">{settingsState.endHour}h</span>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-background" onClick={() => { if (settingsState.endHour < 23) handleUpdateSettings({ endHour: settingsState.endHour + 1 }); }}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold dark:text-white">{t('showLunarCalendar')}</p>
                          <p className="text-xs text-muted-foreground dark:text-foreground/70">{t('showLunarCalendarDescription')}</p>
                        </div>
                        <Switch
                          checked={settingsState.showLunarCalendar !== false}
                          onCheckedChange={(checked) => handleUpdateSettings({ showLunarCalendar: checked })}
                        />
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === 'sound' && (
                    <div className="rounded-2xl border border-border bg-muted/60 dark:bg-muted/30 p-4 md:p-6 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold dark:text-white">{t('notificationsLabel')}</p>
                          <p className="text-xs text-muted-foreground dark:text-foreground/70">{t('notificationSound')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch checked={!!settingsState.notificationsEnabled} onCheckedChange={(v) => handleUpdateSettings({ notificationsEnabled: v })} />
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl border border-border bg-background/80 p-3 text-xs">
                        <p className={cn(
                          "font-semibold",
                          settingsState.notificationsEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        )}>
                          {settingsState.notificationsEnabled ? t('notificationsStatusOn') : t('notificationsStatusOff')}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground dark:text-foreground/70">
                          {settingsState.notificationsEnabled ? t('notificationsStatusOnDescription') : t('notificationsStatusOffDescription')}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <Label className="dark:text-white">{t('completionSoundLabel')}</Label>
                          <p className="text-[10px] text-muted-foreground dark:text-foreground/70">{t('completionSoundDescription')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select value={settingsState.notificationSound} onValueChange={(v: NotificationSound) => handleUpdateSettings({ notificationSound: v })}>
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bird">{t('bird')}</SelectItem>
                              <SelectItem value="wind">{t('wind')}</SelectItem>
                              <SelectItem value="bell">{t('bell')}</SelectItem>
                              <SelectItem value="chime">{t('chime')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => playNotificationSound(settingsState.notificationSound)}>
                            <Volume2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border" />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold dark:text-white">{t('music')}</p>
                          <p className="text-xs text-muted-foreground dark:text-foreground/70">{t('musicTrack')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch checked={!!settingsState.musicEnabled} onCheckedChange={(v) => handleUpdateSettings({ musicEnabled: v })} />
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="w-full sm:w-auto">
                            <Select value={settingsState.musicTrackId} onValueChange={(v: string) => handleUpdateSettings({ musicTrackId: v })}>
                              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {playlistTracks.map(track => (
                                  <SelectItem key={track.id} value={track.id}>{track.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-full sm:w-48">
                            <Slider value={[settingsState.musicVolume ?? 0.3]} onValueChange={(v: number[]) => handleUpdateSettings({ musicVolume: v[0] })} min={0} max={1} step={0.01} />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-background/70 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">{t('playbackMode')}</span>
                            <Select value={settingsState.musicPlaybackMode} onValueChange={(v: MusicPlaybackMode) => handleUpdateSettings({ musicPlaybackMode: v })}>
                              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="play_once">{t('playOnce')}</SelectItem>
                                <SelectItem value="loop_one">{t('loopOne')}</SelectItem>
                                <SelectItem value="loop_all">{t('loopAll')}</SelectItem>
                                <SelectItem value="shuffle">{t('shuffle')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Input value={musicInputUrl} onChange={(event) => setMusicInputUrl(event.target.value)} placeholder={t('enterMusicUrl')} className="h-9 text-sm" />
                            <Button variant="outline" size="sm" onClick={handleAddMusicUrl} disabled={isMusicLoading}>{t('addMusicUrl')}</Button>
                            {musicError ? <p className="text-[10px] text-red-500">{musicError}</p> : null}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border" />

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold dark:text-white">{t('gymRestTimer')}</p>
                            <p className="text-xs text-muted-foreground dark:text-foreground/70">{t('gymRestTimerDescription')}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch checked={!!settingsState.gymRestEnabled} onCheckedChange={(v) => handleUpdateSettings({ gymRestEnabled: v })} />
                          </div>
                        </div>

                      <div className="grid grid-cols-2 gap-2 items-center">
                        <Input type="number" min={5} max={600} value={settingsState.gymRestDurationSeconds ?? 60} onChange={(e) => handleUpdateSettings({ gymRestDurationSeconds: Number(e.target.value) })} className="h-10 rounded-2xl border border-border" />
                        <div className="flex gap-2">
                          <Switch checked={!!settingsState.gymRestSoundEnabled} onCheckedChange={(v) => handleUpdateSettings({ gymRestSoundEnabled: v })} />
                          <Label className="text-xs dark:text-white">{t('gymRestSound')}</Label>
                        </div>
                        <div className="flex gap-2 col-span-2 items-center">
                          <Switch checked={!!settingsState.gymRestVibrationEnabled} onCheckedChange={(v) => handleUpdateSettings({ gymRestVibrationEnabled: v })} />
                          <Label className="text-xs dark:text-white">{t('gymRestVibration')}</Label>
                        </div>
                      </div>
                    </div>
                    </div>
                  )}

                  {activeSettingsTab === 'appearance' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-border bg-muted/60 dark:bg-muted/30 p-4 md:p-6">
                        <div className="mb-4">
                          <p className="text-sm font-semibold dark:text-white">{t('weekTransitionEffect')}</p>
                          <p className="text-xs text-muted-foreground dark:text-foreground/70">{t('weekTransitionEffectDescription')}</p>
                        </div>
                        <Select value={settingsState.weekTransitionEffect} onValueChange={(v: WeekTransitionEffect) => handleUpdateSettings({ weekTransitionEffect: v })}>
                          <SelectTrigger className="w-full sm:w-80"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slide">{t('transitionSlide')}</SelectItem>
                            <SelectItem value="fade">{t('transitionFade')}</SelectItem>
                            <SelectItem value="none">{t('transitionNone')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="rounded-2xl border border-border bg-muted/60 dark:bg-muted/30 p-4 md:p-6">
                        <BackgroundCustomizer
                          config={settingsState.backgroundConfig}
                          onChange={(config) => handleUpdateSettings({ backgroundConfig: config })}
                          t={t}
                          theme={settingsState.theme}
                        />
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === 'account' && (
                    <div className="rounded-2xl border border-border bg-muted/60 dark:bg-muted/30 p-4 md:p-6">
                      {user ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3">
                          <img src={user.photoURL || ''} className="w-12 h-12 rounded-full flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{user.displayName}</p>
                            <p className="text-xs opacity-70 dark:opacity-80 truncate">{user.email}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => { void handleLogout(); }} className="flex-shrink-0 whitespace-nowrap">{t('signOut')}</Button>
                        </div>
                      ) : (
                        <Button
                          disabled={loginLoading}
                          onClick={async () => {
                            setLoginLoading(true);
                            try {
                              await signInWithGoogle();
                            } catch (err: any) {
                              toast.error(err.message || "Đăng nhập thất bại");
                            } finally {
                              setLoginLoading(false);
                            }
                          }}
                          className="w-full bg-[#107C41] hover:bg-[#0d6435] text-white"
                        >
                          {loginLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          {t('signIn')}
                        </Button>
                      )}
                    </div>
                  
                  )}
                  </div>
                </main>
              </div>
            </SettingsErrorBoundary>
         </DialogContent>
      </Dialog>

      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('summaryYear').replace('{year}', format(new Date(), 'yyyy'))}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Array.from({ length: 52 }, (_, i) => {
              const ws = startOfWeek(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), i - 26), { weekStartsOn: 1 });
              const weekPlans = plans.filter(p => isSameWeek(new Date(p.date), ws, { weekStartsOn: 1 }));
              const completed = weekPlans.filter(p => p.color === 'green').length;
              const total = weekPlans.length;
              const ratio = total > 0 ? (completed / total) : 0;
              
              return (
                <div 
                  key={i} 
                    className={cn(
                      "p-2 rounded border text-center transition-all cursor-pointer hover:scale-105",
                      isSameWeek(ws, new Date(), { weekStartsOn: 1 }) ? "ring-2 ring-[#107C41]" : "",
                      "bg-muted/50 border-border"
                    )}
                  onClick={() => { setSelectedWeekStart(ws); setIsSummaryOpen(false); }}
                >
                  <p className="text-[10px] font-bold opacity-50 uppercase">{t('week')} {format(ws, 'w')}</p>
                  <div className="my-1 flex justify-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black relative overflow-hidden" 
                         style={{ background: `conic-gradient(#107C41 ${ratio * 360}deg, var(--chart-track) 0deg)` }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center z-10 bg-background">
                        {Math.round(ratio * 100)}%
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] opacity-40">{format(ws, 'd/M')}</p>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
