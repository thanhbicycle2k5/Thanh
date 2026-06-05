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
  isSameWeek 
} from 'date-fns';
import { Plan, NotificationSound } from './types';
import { storage } from './lib/storage';
import { auth, db, signInWithGoogle, signOutUser, clearAuthState, onAuthChanged, cloudStorage, subscribePlans, settleRedirectAuth } from './lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { PRESET_TRACKS } from './lib/musicTracks';
import { playNotificationSound, playMusicalNote } from './lib/sounds';
import { healthTipsManager } from './lib/healthTips';
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
  Play,
  Pause,
  RotateCcw,
  X,
  Timer,
  BookOpen,
  Move,
} from 'lucide-react';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { translations, TranslationKey } from './lib/i18n';
import { AppSettings, Language, Theme, CatMood, BackgroundConfig } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { DynamicCat } from './components/DynamicCat';
import { BackgroundCustomizer } from './components/BackgroundCustomizer';
import { CelebrationEffect } from './components/CelebrationEffect';

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

function HealthTipPanel({ theme, isSettingsOpen, t, lang }: { theme: Theme; isSettingsOpen: boolean; t: (k: TranslationKey) => string; lang: Language }) {
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
          setOpen((v) => !v);
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
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [isSummaryOpen, setIsSummaryOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [gymRestOpen, setGymRestOpen] = React.useState(false);
  const [gymRestRunning, setGymRestRunning] = React.useState(false);
  const [gymRestRemaining, setGymRestRemaining] = React.useState(60);
  const [gymRestEndAt, setGymRestEndAt] = React.useState<number | null>(null);
  const [gymRestRound, setGymRestRound] = React.useState(1);
  const [gymRestMessage, setGymRestMessage] = React.useState('');
  const [user, setUser] = React.useState<User | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [settings, setSettings] = React.useState<AppSettings>(() => storage.getSettings());

  React.useEffect(() => {
    if (!gymRestRunning) {
      setGymRestRemaining(settings.gymRestDurationSeconds ?? 60);
    }
  }, [settings.gymRestDurationSeconds, gymRestRunning]);

  type PomodoroMode = 'work' | 'short' | 'long';
  const POMODORO_DURATIONS: Record<PomodoroMode, number> = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const [isPomodoroOpen, setIsPomodoroOpen] = React.useState(false);
  const [pomodoroMode, setPomodoroMode] = React.useState<PomodoroMode>('work');
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = React.useState(POMODORO_DURATIONS.work);
  const [pomodoroRunning, setPomodoroRunning] = React.useState(false);
  const [pomodoroSessions, setPomodoroSessions] = React.useState(0);
  const [showCelebration, setShowCelebration] = React.useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pomodoroRunning && pomodoroSecondsLeft > 0) {
      interval = setInterval(() => {
        setPomodoroSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (pomodoroSecondsLeft === 0) {
      setPomodoroRunning(false);
      playNotificationSound(settings.notificationSound);
      if (pomodoroMode === 'work') setPomodoroSessions(v => v + 1);
      toast.success(t(pomodoroMode === 'work' ? 'workCompleted' : 'breakOver'));
    }
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroSecondsLeft, pomodoroMode, settings.notificationSound]);

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

  const [selectedMusicId, setSelectedMusicId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = React.useState(false);

  React.useEffect(() => {
    if (selectedMusicId) {
      const track = PRESET_TRACKS.find(t => t.id === selectedMusicId);
      if (track) {
        if (!audioRef.current) {
          audioRef.current = new Audio(track.url);
          audioRef.current.loop = true;
        } else {
          audioRef.current.src = track.url;
        }
        if (isMusicPlaying) audioRef.current.play();
      }
    } else {
      audioRef.current?.pause();
    }
  }, [selectedMusicId]);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const t = (key: keyof typeof translations.en, params: Record<string, string> = {}) => {
    let text = translations[settings.language][key];
    if (!text) return key;
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
    return text;
  };

  const [selectedWeekStart, setSelectedWeekStart] = React.useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const [loginLoading, setLoginLoading] = React.useState(false);

  // Data Migration / Initial Fetch
  React.useEffect(() => {
     settleRedirectAuth()
       .then(res => { if (res?.user) setUser(res.user); })
       .catch(err => {
         console.error("Initial redirect result error:", err);
         toast.error(t('loginFailed'));
       });
       
     const unsub = onAuthChanged(async (firebaseUser) => {
        setUser(firebaseUser);
        setAuthLoading(false);
        if (firebaseUser) {
           setSyncing(true);
           
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

             const localPlansForUid = storage.getPlans(firebaseUser.uid);
             const anonymousPlans = storage.getPlans();
             
             if (cloudPlans.length === 0) {
               const plansToMigrate = localPlansForUid.length > 0 ? localPlansForUid : anonymousPlans;
               if (plansToMigrate.length > 0) {
                 await cloudStorage.savePlans(firebaseUser.uid, plansToMigrate);
                 toast.success(t('dataSynced'));
               }
             }

             const localMetasForUid = storage.getWeekMetas(firebaseUser.uid);
             const anonymousMetas = storage.getWeekMetas();
             if (Object.keys(cloudWeekMetas).length === 0) {
               const metasToMigrate = Object.keys(localMetasForUid).length > 0 ? localMetasForUid : anonymousMetas;
               if (Object.keys(metasToMigrate).length > 0) {
                 await setDoc(doc(db, "users", firebaseUser.uid, "meta", "weekMetas"), metasToMigrate);
               }
             }

             const initialPlans = cloudPlans.length > 0 ? cloudPlans : (localPlansForUid.length > 0 ? localPlansForUid : anonymousPlans);
             setPlans(initialPlans);
             
             const initialMetas = Object.keys(cloudWeekMetas).length > 0 ? cloudWeekMetas : (Object.keys(localMetasForUid).length > 0 ? localMetasForUid : anonymousMetas);
             setWeekMetas(initialMetas);

             if (Object.keys(cloudSettings).length > 0) {
               setSettings(prev => ({ ...prev, ...cloudSettings }));
             }

             const unsubPlans = subscribePlans(firebaseUser.uid, p => { 
                if (p.length > 0 || initialPlans.length === 0) {
                  setPlans(p); 
                  storage.savePlans(p, firebaseUser.uid);
                }
                setSyncing(false); 
             });
             
             return () => { unsubPlans(); };
           } catch (e) {
             console.error("Failed to sync/migrate data:", e);
             setSyncing(false);
           }
        } else {
           setPlans(storage.getPlans());
           setWeekMetas(storage.getWeekMetas());
           setSettings(storage.getSettings());
           setSyncing(false);
        }
     });
     return unsub;
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    if (settings.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return () => clearInterval(timer);
  }, [settings.theme]);

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    storage.saveSettings(newSettings, user?.uid);
    if (user) cloudStorage.saveSettings(user.uid, newSettings);
  };

  const formatSeconds = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const startGymRest = () => {
    const duration = settings.gymRestDurationSeconds ?? 60;
    setGymRestEndAt(Date.now() + duration * 1000);
    setGymRestRemaining(duration);
    setGymRestRunning(true);
    setGymRestMessage('');
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
    setGymRestRemaining(settings.gymRestDurationSeconds ?? 60);
  };

  React.useEffect(() => {
    if (!gymRestRunning || gymRestEndAt === null) return;
    const tick = () => {
      const remaining = Math.max(0, Math.round((gymRestEndAt - Date.now()) / 1000));
      setGymRestRemaining(remaining);
      if (remaining <= 0) {
        setGymRestRunning(false);
        setGymRestEndAt(null);
        setGymRestRound((round) => round + 1);
        setGymRestMessage(t('gymRestNextSet'));
        if (settings.gymRestSoundEnabled) {
          playNotificationSound(settings.notificationSound);
        }
        if (navigator.vibrate) {
          navigator.vibrate(300);
        }
      }
    };
    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [gymRestRunning, gymRestEndAt, settings.gymRestSoundEnabled, settings.notificationSound]);

  const currentWeekPlans = React.useMemo(() => {
    return plans.filter(p => isSameWeek(new Date(p.date), selectedWeekStart, { weekStartsOn: 1 }));
  }, [plans, selectedWeekStart]);

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

  const handleUpdatePlan = (p: Plan) => {
    const oldPlan = plans.find(x => x.id === p.id);
    if (oldPlan && oldPlan.color !== 'green' && p.color === 'green') {
      playNotificationSound(settings.notificationSound);
      const motivators = [t('motivate1'), t('motivate2'), t('motivate3'), t('motivate4'), t('motivate5')];
      const message = motivators[Math.floor(Math.random() * motivators.length)];
      toast.success(message, { 
        icon: <Trophy className="w-4 h-4 text-yellow-500" />,
        duration: 3000 
      });
      setShowCelebration(true);
    }
    if (user) {
      cloudStorage.savePlan(user.uid, p);
    } else {
      setPlans(plans.map(x => x.id === p.id ? p : x));
    }
  };
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

  // Build background style
  const getBackgroundStyle = React.useCallback((): React.CSSProperties => {
    if (!settings.backgroundConfig) {
      return {};
    }

    const { type, value, opacity = 1 } = settings.backgroundConfig;

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
  }, [settings.backgroundConfig]);

  return (
    <div 
      className={cn(
        "h-screen flex flex-col transition-colors duration-300 overflow-hidden relative",
        settings.theme === 'dark' && "dark",
        "bg-background text-foreground",
        settings.language === 'vi' ? 'font-vietnamese' : 'font-sans'
      )}
      style={getBackgroundStyle()}
    >
      {/* Background overlay for better text readability */}
      {settings.backgroundConfig && (
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
             <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => {
                playMusicalNote();
                handleUpdateSettings({ notificationsEnabled: !settings.notificationsEnabled });
              }}>
                {settings.notificationsEnabled ? <Bell className="w-4 h-4 text-[#107C41]" /> : <BellOff className="w-4 h-4" />}
             </Button>

             <Popover>
               <PopoverTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => playMusicalNote()}>
                    <Music className={cn("w-4 h-4 transition-all", isMusicPlaying && "text-[#107C41] animate-spin-slow")} />
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-64 p-4" align="end">
                 <div className="space-y-4">
                   <h3 className="font-bold text-sm uppercase tracking-wider">{t('music')}</h3>
                   <div className="grid gap-1">
                     {PRESET_TRACKS.map(track => (
                       <Button 
                         key={track.id}
                         variant={selectedMusicId === track.id ? "secondary" : "ghost"} 
                         size="sm"
                         className="w-full justify-start text-left text-xs h-8"
                         onClick={() => {
                           if (selectedMusicId === track.id) {
                             toggleMusic();
                           } else {
                             setSelectedMusicId(track.id);
                             setIsMusicPlaying(true);
                           }
                         }}
                       >
                         {selectedMusicId === track.id && isMusicPlaying ? <Pause className="w-3 h-3 mr-2" /> : <Play className="w-3 h-3 mr-2" />}
                         <span className="truncate">{track.name}</span>
                       </Button>
                     ))}
                   </div>
                   {selectedMusicId && (
                     <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => { setSelectedMusicId(null); setIsMusicPlaying(false); }}>
                       Stop Music
                     </Button>
                   )}
                 </div>
               </PopoverContent>
             </Popover>

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
             <ScheduleGrid 
                currentWeekStart={selectedWeekStart}
                plans={plans}
                onAddPlan={p => user ? cloudStorage.savePlan(user.uid, p) : setPlans([...plans, p])}
                onUpdatePlan={handleUpdatePlan}
                onDeletePlan={id => user ? cloudStorage.deletePlan(user.uid, id) : setPlans(plans.filter(x => x.id !== id))}
                language={settings.language}
                theme={settings.theme}
                startHour={settings.startHour}
                endHour={settings.endHour}
             />
             <div className="p-4 border-t bg-muted/30">
               <Label className="text-[10px] font-bold uppercase mb-2 block opacity-50">{t('weekNote')}</Label>
               <WeekNoteEditor 
                  weekStart={selectedWeekStart}
                  initialNote={weekMetas[format(selectedWeekStart, 'yyyy-MM-dd')]?.note || ''}
                  theme={settings.theme}
                  placeholder={t('weekNotePlaceholder')}
                  btnSaveText={t('saveNote')}
                  btnSavedText={t('saved')}
                  onSave={(note) => {
                    const key = format(selectedWeekStart, 'yyyy-MM-dd');
                    const updated = { ...weekMetas, [key]: { ...weekMetas[key], note } };
                    setWeekMetas(updated);
                    storage.saveWeekMeta(key, { note }, user?.uid);
                    if (user) cloudStorage.saveWeekMeta(user.uid, key, { note });
                  }}
               />
             </div>
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
                                     if (user) cloudStorage.saveWeekMeta(user.uid, key, { color: null });
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
                                        if (user) cloudStorage.saveWeekMeta(user.uid, key, { color: c.value });
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
                                  if (user) cloudStorage.saveWeekMeta(user.uid, key, { note: e.target.value });
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
                               if (user) cloudStorage.saveWeekMeta(user.uid, key, updated[key]);
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
      <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-3 pointer-events-none items-end">
        <HealthTipPanel theme={settings.theme} isSettingsOpen={isSettingsOpen} t={t} lang={settings.language} />
        {settings.gymRestEnabled && (
          <div className="relative inline-block pointer-events-auto">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setGymRestOpen((v) => !v)}
              className="w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 bg-[#107C41] text-white"
              title={t('gymRestIconLabel')}
            >
              <Timer className="w-6 h-6" />
            </button>
            <AnimatePresence>
              {gymRestOpen && (
                <motion.div
                  drag
                  dragMomentum={false}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute z-40 w-72 right-0 bottom-14 border shadow-2xl rounded-xl overflow-hidden cursor-move bg-card border-border"
                >
                  <Card className="border-0 shadow-none bg-transparent">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted">
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-wider">{t('gymRestTimer')}</h3>
                          <p className="text-[10px] opacity-70">{t('gymRestDuration')} {formatSeconds(settings.gymRestDurationSeconds ?? 60)}</p>
                        </div>
                        <X className="w-3.5 h-3.5 cursor-pointer hover:text-red-500 transition-colors" onClick={() => setGymRestOpen(false)} />
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="text-center py-5 rounded-2xl border border-border bg-background">
                          <div className="text-4xl font-black font-mono">{formatSeconds(gymRestRemaining)}</div>
                          <p className="text-[10px] uppercase opacity-70 mt-1 font-bold tracking-widest">{`${t('gymRestTimer')} • Hiệp ${gymRestRound}`}</p>
                        </div>
                        {gymRestMessage && (
                          <div className="rounded-xl bg-green-500/10 text-green-700 px-3 py-2 text-xs">
                            {gymRestMessage}
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            className={cn(
                              "h-9 rounded-xl text-sm font-bold",
                              gymRestRunning ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-[#107C41] text-white hover:bg-[#0d6435]'
                            )}
                            onClick={() => {
                              if (gymRestRunning) {
                                pauseGymRest();
                              } else {
                                startGymRest();
                              }
                            }}
                          >
                            {gymRestRunning ? (
                              <><Pause className="w-4 h-4 mr-1 inline" />{t('pause')}</>
                            ) : (
                              <><Play className="w-4 h-4 mr-1 inline" />{t('start')}</>
                            )}
                          </Button>
                          <Button variant="outline" size="sm" className="h-9" onClick={resetGymRest}>
                            {t('reset')}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-9" onClick={() => setGymRestOpen(false)}>
                            {t('cancel')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        {/* Dynamic Cat */}
        {settings.catEnabled !== false && (
          <motion.div
            animate={{ x: [0, -8, 8, 0], y: [0, -6, 6, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="pointer-events-auto"
          >
            <DynamicCat 
              mood={catMood} 
              size="md"
              onClick={() => {
                playMusicalNote();
                setShowCelebration(true);
              }}
            />
          </motion.div>
        )}
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

      <CelebrationEffect trigger={showCelebration} count={25} />
      <Toaster />

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
         <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{t('settings')}</DialogTitle></DialogHeader>
            <Tabs defaultValue="general" className="w-full">
               <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
                  <TabsTrigger value="general" className="text-[10px]">Chung</TabsTrigger>
                  <TabsTrigger value="schedule" className="text-[10px]">Lịch</TabsTrigger>
                  <TabsTrigger value="sound" className="text-[10px]">Âm thanh</TabsTrigger>
                  <TabsTrigger value="appearance" className="text-[10px]">Giao diện</TabsTrigger>
                  <TabsTrigger value="account" className="text-[10px] hidden lg:flex">Tài khoản</TabsTrigger>
               </TabsList>

               {/* General Tab */}
               <TabsContent value="general" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                     <Label>{t('language')}</Label>
                     <Select value={settings.language} onValueChange={(v: Language) => handleUpdateSettings({language:v})}>
                       <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                       <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="vi">Tiếng Việt</SelectItem></SelectContent>
                     </Select>
                  </div>
                  <div className="flex justify-between items-center">
                     <Label>{t('theme')}</Label>
                     <div className="flex justify-between items-center bg-muted p-1 rounded-lg">
                       <Button variant={settings.theme === 'light' ? 'secondary' : 'ghost'} size="xs" onClick={() => handleUpdateSettings({theme:'light'})}><Sun className="w-3 h-3"/></Button>
                       <Button variant={settings.theme === 'dark' ? 'secondary' : 'ghost'} size="xs" onClick={() => handleUpdateSettings({theme:'dark'})}><Moon className="w-3 h-3"/></Button>
                     </div>
                  </div>
                  <div className="flex justify-between items-center gap-4 pt-2">
                     <Label>{t('cat')}</Label>
                     <Switch
                       checked={settings.catEnabled !== false}
                       onCheckedChange={(checked) => handleUpdateSettings({ catEnabled: checked })}
                     />
                  </div>
                  <div className="border-t border-border pt-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{t('gymRestTimer')}</p>
                        <p className="text-xs opacity-70">{t('gymRestTimerDescription')}</p>
                      </div>
                      <Switch
                        checked={settings.gymRestEnabled ?? false}
                        onCheckedChange={(checked) => handleUpdateSettings({ gymRestEnabled: checked })}
                      />
                    </div>
                    {settings.gymRestEnabled && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {[30, 45, 60, 90, 120].map((sec) => (
                            <Button
                              key={sec}
                              variant={settings.gymRestDurationSeconds === sec ? 'secondary' : 'outline'}
                              size="sm"
                              className="h-9"
                              onClick={() => handleUpdateSettings({ gymRestDurationSeconds: sec })}
                            >
                              {sec}s
                            </Button>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            type="number"
                            min={10}
                            max={300}
                            className="w-24"
                            value={(settings.gymRestDurationSeconds ?? 60).toString()}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              if (!Number.isNaN(value) && value > 0) {
                                handleUpdateSettings({ gymRestDurationSeconds: value });
                              }
                            }}
                          />
                          <span className="text-sm opacity-70">s</span>
                          <span className="text-xs opacity-70">{t('gymRestDuration')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{t('gymRestSound')}</span>
                          <Switch
                            checked={settings.gymRestSoundEnabled ?? true}
                            onCheckedChange={(checked) => handleUpdateSettings({ gymRestSoundEnabled: checked })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
               </TabsContent>

               {/* Schedule Tab */}
               <TabsContent value="schedule" className="space-y-6 mt-4">
                  <div className="space-y-4">
                     <div className="flex justify-between items-center text-xs">
                        <span className="opacity-70">{t('startHour')}</span>
                        <div className="flex items-center gap-3">
                           <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg bg-muted" onClick={() => { if (settings.startHour > 0) handleUpdateSettings({startHour: settings.startHour - 1}); }}>
                              <Minus className="w-3 h-3" />
                           </Button>
                           <span className="font-black text-[#107C41] w-8 text-center">{settings.startHour}h</span>
                           <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg bg-muted" onClick={() => { if (settings.startHour < settings.endHour - 1) handleUpdateSettings({startHour: settings.startHour + 1}); }}>
                              <Plus className="w-3 h-3" />
                           </Button>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center text-xs">
                        <span className="opacity-70">{t('endHour')}</span>
                        <div className="flex items-center gap-3">
                           <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg bg-muted" onClick={() => { if (settings.endHour > settings.startHour + 1) handleUpdateSettings({endHour: settings.endHour - 1}); }}>
                              <Minus className="w-3 h-3" />
                           </Button>
                           <span className="font-black text-[#107C41] w-8 text-center">{settings.endHour}h</span>
                           <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg bg-muted" onClick={() => { if (settings.endHour < 23) handleUpdateSettings({endHour: settings.endHour + 1}); }}>
                              <Plus className="w-3 h-3" />
                           </Button>
                        </div>
                     </div>
                  </div>
               </TabsContent>

               {/* Sound Tab */}
               <TabsContent value="sound" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center gap-4">
                     <Label className="flex-1">{t('notificationSound')}</Label>
                     <div className="flex items-center gap-2">
                       <Select value={settings.notificationSound} onValueChange={(v: NotificationSound) => handleUpdateSettings({notificationSound:v})}>
                         <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="bird">{t('bird')}</SelectItem>
                           <SelectItem value="wind">{t('wind')}</SelectItem>
                           <SelectItem value="bell">{t('bell')}</SelectItem>
                           <SelectItem value="chime">{t('chime')}</SelectItem>
                         </SelectContent>
                       </Select>
                       <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => playNotificationSound(settings.notificationSound)}>
                          <Volume2 className="w-3.5 h-3.5" />
                       </Button>
                     </div>
                  </div>
               </TabsContent>

               {/* Appearance Tab */}
               <TabsContent value="appearance" className="space-y-4 mt-4 max-h-[50vh] overflow-y-auto">
                  <BackgroundCustomizer
                    config={settings.backgroundConfig}
                    onChange={(config) => handleUpdateSettings({ backgroundConfig: config })}
                    t={t}
                    theme={settings.theme}
                  />
               </TabsContent>

               {/* Account Tab */}
               <TabsContent value="account" className="space-y-4 mt-4">
                 {user ? (
                    <div className="flex items-center gap-3">
                      <img src={user.photoURL || ''} className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-bold">{user.displayName}</p>
                        <p className="text-xs opacity-60">{user.email}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => signOutUser()} className="text-red-500">{t('signOut')}</Button>
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
                 <div className="pt-4 border-t border-border flex justify-center">
                   <p className="text-[10px] opacity-30 flex items-center gap-1.5 font-medium">
                     <span className="w-1 h-1 bg-[#107C41] rounded-full"></span>
                     {t('inspiredBy')}
                   </p>
                 </div>
               </TabsContent>
            </Tabs>
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
