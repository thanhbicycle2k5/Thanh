import * as React from 'react';
import { 
  format, 
  addDays, 
  isSameDay,
  getISOWeek,
} from 'date-fns';
import { Plan, PlanColor, Language, Theme, TaskApplyMode } from '../types';
import { cn } from '@/lib/utils';
import { Plus, Edit2, Trash2, Download } from 'lucide-react';
import { Solar } from 'lunar-javascript';
import { translations } from '../lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toJpeg, toPng } from 'html-to-image';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { START_MINUTE_OPTIONS, formatPlanTime, getPlanEndMinutes } from '../lib/taskTime';

const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

const COLOR_MAP: Record<PlanColor, string> = {
  default: 'bg-card grayscale',
  green: 'bg-[#92D050] text-[#000]',
  yellow: 'bg-[#FFFF00] text-[#000]',
  gray: 'bg-[#7F7F7F] text-[#fff]',
  red: 'bg-[#FF0000] text-[#fff]',
  blue: 'bg-[#0070C0] text-[#fff]',
  pink: 'bg-[#FF69B4] text-[#000]',
};

interface ScheduleCellProps {
  dayKey: string;
  dayIndex: number;
  hour: number;
  plan?: Plan;
  isPartOfPreviousPlan: boolean;
  day: Date;
  handleUnifiedClick: (date: Date, hour: number, existingPlan?: Plan) => void;
  handleOpenEdit: (plan: Plan, e: React.MouseEvent) => void;
  t: (key: keyof typeof translations.en) => string;
}

const ScheduleCell = React.memo(function ScheduleCell({
  dayKey,
  dayIndex,
  hour,
  plan,
  isPartOfPreviousPlan,
  day,
  handleUnifiedClick,
  handleOpenEdit,
  t,
}: ScheduleCellProps) {
  if (isPartOfPreviousPlan) return null;

  return (
    <td
      rowSpan={plan?.duration || 1}
      className={cn(
        "border p-0 relative group cursor-pointer transition-colors duration-150 border-border",
        plan ? COLOR_MAP[plan.color] : "bg-background/50 hover:bg-muted"
      )}
      onClick={() => handleUnifiedClick(day, hour)}
    >
      {plan ? (
        <div className={cn("w-full h-full p-1.5 text-[10px] md:text-xs font-bold flex flex-col items-center justify-center text-center relative leading-tight gap-0.5", (plan.startMinute ?? 0) > 0 && "pt-4")}>
          {(plan.startMinute ?? 0) > 0 && (
            <span className="absolute left-1 top-0.5 text-[8px] md:text-[9px] font-black tracking-wide opacity-80">
              {formatPlanTime(plan.startHour, plan.startMinute ?? 0)}
            </span>
          )}
          <span className={cn(plan.title === '' && "italic opacity-30")}>
            {plan.title || t('enterTask')}
          </span>
          {plan.duration > 1 && (
            <span className="text-[9px] opacity-50">{plan.duration}{t('hours_suffix')}</span>
          )}
          {plan.notes && (
            <span className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-current opacity-40" title={plan.notes} />
          )}
          <button
            onClick={(e) => {
              handleOpenEdit(plan, e);
            }}
            className="absolute bottom-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-muted/40 p-1 rounded hover:bg-muted/60"
          >
            <Edit2 className="w-2 md:w-3 h-2 md:h-3" />
          </button>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
          <Plus className="w-4 md:w-5 h-4 md:h-5 text-muted-foreground" />
        </div>
      )}
    </td>
  );
});

interface ScheduleGridProps {
  currentWeekStart: Date;
  plans: Plan[];
  onAddPlan: (plan: Plan) => void;
  onUpdatePlan: (plan: Plan) => void;
  onDeletePlan: (id: string) => void;
  onPlanTurnGreen?: (plan: Plan) => void;
  language: Language;
  theme: Theme;
  startHour: number;
  endHour: number;
  showLunarCalendar: boolean;
}

function ScheduleGridComponent({ 
  currentWeekStart, 
  plans, 
  onAddPlan, 
  onUpdatePlan, 
  onDeletePlan,
  onPlanTurnGreen,
  language,
  theme,
  startHour,
  endHour,
  showLunarCalendar,
}: ScheduleGridProps) {

  const t = React.useCallback((key: keyof typeof translations.en) => translations[language][key], [language]);
  const dayLabels = React.useMemo(() => [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')], [t]);
  const dayShortLabels = React.useMemo(() => [t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')], [t]);

  const getLunarLabel = React.useCallback((date: Date) => {
    try {
      const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
      const lunar = solar.getLunar();
      return `${lunar.getDay()}/${lunar.getMonth()}`;
    } catch {
      return '';
    }
  }, []);

  const HOURS = React.useMemo(
    () => Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour),
    [startHour, endHour]
  );

  const [editingPlan, setEditingPlan] = React.useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newColor, setNewColor] = React.useState<PlanColor>('yellow');
  const [newStartMinute, setNewStartMinute] = React.useState<number>(0);
  const [newDuration, setNewDuration] = React.useState(1);
  const [newApplyMode, setNewApplyMode] = React.useState<TaskApplyMode>('none');
  const [newApplyDays, setNewApplyDays] = React.useState<NonNullable<Plan['applyDays']>>([]);
  const [newApplyWeekInterval, setNewApplyWeekInterval] = React.useState<number>(1);
  const [newApplyWeekDays, setNewApplyWeekDays] = React.useState<NonNullable<Plan['applyWeekDays']>>([]);
  const [newApplyUntil, setNewApplyUntil] = React.useState<string | undefined>(undefined);
  const [newNotes, setNewNotes] = React.useState('');
  const [allowTextInput, setAllowTextInput] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const scheduleTableRef = React.useRef<HTMLTableElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  const startOfMonday = React.useCallback((date: Date) => {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const currentTaskWeekIndex = React.useMemo(() => {
    const baseDate = editingPlan ? new Date(editingPlan.date) : new Date();
    return getISOWeek(baseDate);
  }, [editingPlan]);

  const displayWeekTarget = React.useMemo(() => {
    return Math.max(1, currentTaskWeekIndex + Math.max(1, newApplyWeekInterval || 1));
  }, [currentTaskWeekIndex, newApplyWeekInterval]);

  const defaultApplyUntilDate = React.useMemo(() => {
    if (editingPlan?.date) {
      return editingPlan.date.slice(0, 10);
    }
    const baseDate = new Date();
    return format(baseDate, 'yyyy-MM-dd');
  }, [editingPlan?.date]);

  React.useEffect(() => {
    if (newApplyMode === 'day' && !newApplyUntil) {
      setNewApplyUntil(defaultApplyUntilDate);
    }
    if (newApplyMode === 'week' && !newApplyUntil) {
      setNewApplyUntil(defaultApplyUntilDate);
    }
  }, [defaultApplyUntilDate, newApplyMode, newApplyUntil]);

  const daysOfCurrentWeek = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const planMap = React.useMemo(() => {
    const map = new Map<string, Plan>();
    plans.forEach((plan) => {
      const dayKey = format(new Date(plan.date), 'yyyy-MM-dd');
      const key = `${dayKey}#${plan.startHour}`;
      map.set(key, plan);
    });
    return map;
  }, [plans]);

  const occupiedHoursMap = React.useMemo(() => {
    const map = new Map<string, boolean>();
    plans.forEach((plan) => {
      const dayKey = format(new Date(plan.date), 'yyyy-MM-dd');
      for (let hour = plan.startHour + 1; hour < plan.startHour + plan.duration; hour += 1) {
        map.set(`${dayKey}#${hour}`, true);
      }
    });
    return map;
  }, [plans]);

  const clickCount = React.useRef(0);
  const clickTimer = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!isDialogOpen) return;

    if (typeof window === 'undefined') return;

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (!isMobile) {
      setAllowTextInput(true);
      return;
    }

    setAllowTextInput(false);

    const timer = window.setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement | null;
      if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement || activeElement instanceof HTMLButtonElement) {
        activeElement.blur();
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isDialogOpen]);

  const handleTextFieldInteraction = React.useCallback(() => {
    if (typeof window === 'undefined') return;

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile) {
      setAllowTextInput(true);
    }
  }, []);

  const handleUnifiedClick = React.useCallback((date: Date, hour: number, existingPlan?: Plan) => {
    const existing = existingPlan ?? plans.find(p => isSameDay(new Date(p.date), date) && p.startHour === hour);

    if (!existing || existing.title === '') {
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
        clickTimer.current = null;
        clickCount.current = 0;
      }

      if (existing) {
        setEditingPlan(existing);
        setNewTitle(existing.title);
        setNewColor(existing.color);
        setNewStartMinute(existing.startMinute ?? 0);
        setNewDuration(existing.duration);
        setNewApplyMode(existing.applyMode || 'none');
        setNewApplyDays(existing.applyDays || []);
        setNewApplyWeekInterval(existing.applyWeekInterval || 1);
        setNewApplyWeekDays(existing.applyWeekDays || []);
        setNewApplyUntil(existing.applyUntil || existing.date.slice(0, 10));
        setNewNotes(existing.notes || '');
      } else {
        setEditingPlan({
          id: crypto.randomUUID(),
          title: '',
          date: date.toISOString(),
          startHour: hour,
          startMinute: 0,
          duration: 1,
          color: 'yellow'
        } as Plan);
        setNewTitle('');
        setNewColor('yellow');
        setNewStartMinute(0);
        setNewDuration(1);
        setNewApplyMode('none');
        setNewApplyDays([]);
        setNewApplyWeekInterval(1);
        setNewApplyWeekDays([]);
        setNewApplyUntil(date.toISOString().slice(0, 10));
        setNewNotes('');
      }
      setIsDialogOpen(true);
      return;
    }

    clickCount.current += 1;

    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }

    clickTimer.current = setTimeout(() => {
      if (clickCount.current === 1) {
        const updated = { ...existing, color: 'yellow' as PlanColor };
        onUpdatePlan(updated);
      } else if (clickCount.current === 2) {
        const updated = { ...existing, color: 'green' as PlanColor };
        onUpdatePlan(updated);
        if (existing.color !== 'green') {
          onPlanTurnGreen?.(updated);
        }
      } else if (clickCount.current >= 3) {
        onUpdatePlan({ ...existing, color: 'default' as PlanColor });
      }
      clickCount.current = 0;
      clickTimer.current = null;
    }, 300);
  }, [onPlanTurnGreen, onUpdatePlan, plans]);

  const handleOpenEdit = React.useCallback((plan: Plan, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPlan(plan);
    setNewTitle(plan.title);
    setNewColor(plan.color);
    setNewStartMinute(plan.startMinute ?? 0);
    setNewDuration(plan.duration);
    setNewApplyMode(plan.applyMode || 'none');
    setNewApplyDays(plan.applyDays || []);
    setNewApplyWeekInterval(plan.applyWeekInterval || 1);
    setNewApplyWeekDays(plan.applyWeekDays || []);
    setNewApplyUntil(plan.applyUntil || plan.date.slice(0, 10));
    setNewNotes(plan.notes || '');
    setIsDialogOpen(true);
  }, []);

  const handleSave = async () => {
    if (!editingPlan) return;
    
    const basePlan = { ...editingPlan, title: newTitle, color: newColor, startMinute: newStartMinute, duration: newDuration, applyMode: newApplyMode, applyDays: newApplyDays.length? newApplyDays: undefined, applyWeekInterval: newApplyWeekInterval || undefined, applyWeekDays: newApplyWeekDays.length? newApplyWeekDays: undefined, applyUntil: newApplyUntil || undefined, notes: newNotes || undefined };
    const wasGreen = plans.find(p => p.id === editingPlan.id)?.color === 'green';
    const isNew = !plans.some(p => p.id === basePlan.id);

    const overlaps = (dateIso: string, startHour: number, startMinute: number, duration: number) => {
      return plans.some(p => {
        if (!isSameDay(new Date(p.date), new Date(dateIso))) return false;

        const pStart = (p.startHour * 60) + (p.startMinute ?? 0);
        const pEnd = getPlanEndMinutes({ startHour: p.startHour, startMinute: p.startMinute ?? 0, duration: p.duration });
        const bStart = (startHour * 60) + startMinute;
        const bEnd = getPlanEndMinutes({ startHour, startMinute, duration });

        return (pStart < bEnd && bStart < pEnd);
      });
    };

    try {
      const addGeneratedDayPlan = async (candidateDate: Date) => {
        const candidateKey = format(candidateDate, 'yyyy-MM-dd');
        if (candidateDate < new Date(basePlan.date)) {
          return;
        }
        if (!overlaps(candidateKey, basePlan.startHour, basePlan.startMinute ?? 0, basePlan.duration)) {
          const newPlan = { ...basePlan, id: crypto.randomUUID(), date: candidateKey };
          await onAddPlan(newPlan);
        }
      };

      const addGeneratedWeekPlan = async (candidateDate: Date) => {
        const candidateKey = format(candidateDate, 'yyyy-MM-dd');
        if (candidateDate < new Date(basePlan.date)) {
          return;
        }
        if (!overlaps(candidateKey, basePlan.startHour, basePlan.startMinute ?? 0, basePlan.duration)) {
          const newPlan = { ...basePlan, id: crypto.randomUUID(), date: candidateKey };
          await onAddPlan(newPlan);
        }
      };

      if (isNew) {
        // Always add the base plan for the selected date if no overlap
        if (!overlaps(basePlan.date, basePlan.startHour, basePlan.startMinute ?? 0, basePlan.duration)) {
          await onAddPlan(basePlan);
        }

        // Handle applyMode 'day' -> apply daily until date
        if (basePlan.applyMode === 'day' && basePlan.applyUntil) {
          let cur = new Date(basePlan.date);
          const end = new Date(basePlan.applyUntil);
          cur.setHours(basePlan.startHour, basePlan.startMinute ?? 0, 0, 0);
          cur.setDate(cur.getDate() + 1);
          while (cur <= end) {
            const candidate = new Date(cur);
            candidate.setHours(basePlan.startHour, basePlan.startMinute ?? 0, 0, 0);
            await addGeneratedDayPlan(candidate);
            cur.setDate(cur.getDate() + 1);
          }
        }

        // Handle applyMode 'week' -> apply for the selected number of weeks starting from the current task week.
        if (basePlan.applyMode === 'week' && basePlan.applyWeekDays?.length) {
          const weekCount = Math.max(1, Number(basePlan.applyWeekInterval) || 1);
          const selectedWeekdays = (basePlan.applyWeekDays || []).map((d) => WEEK_DAYS.indexOf(d as WeekDay));
          const baseStart = startOfMonday(new Date(basePlan.date));

          for (let weekOffset = 0; weekOffset < weekCount; weekOffset += 1) {
            const weekStart = new Date(baseStart);
            weekStart.setDate(baseStart.getDate() + (weekOffset * 7));

            for (const weekdayIndex of selectedWeekdays) {
              const candidate = new Date(weekStart);
              candidate.setDate(candidate.getDate() + weekdayIndex);
              candidate.setHours(basePlan.startHour, basePlan.startMinute ?? 0, 0, 0);
              await addGeneratedWeekPlan(candidate);
            }
          }
        }
      } else {
        await onUpdatePlan(basePlan);
      }

      if (!isNew && !wasGreen && newColor === 'green') {
        onPlanTurnGreen?.(basePlan);
      } else if (isNew && newColor === 'green') {
        onPlanTurnGreen?.(basePlan);
      }

      setIsDialogOpen(false);
    } catch (e) {
      console.error('Error saving plan:', e);
    }
  };

  const handleDelete = () => {
    if (editingPlan) {
      setDeleteConfirmOpen(true);
    }
  };

  const confirmDeletePlan = () => {
    if (editingPlan) {
      onDeletePlan(editingPlan.id);
      setDeleteConfirmOpen(false);
      setIsDialogOpen(false);
    }
  };

  const downloadScheduleImage = React.useCallback(async (imageFormat: 'png' | 'jpg') => {
    const table = scheduleTableRef.current;
    if (!table || isExporting) return;

    setIsExporting(true);
    try {
      const imageOptions = {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
        ...(imageFormat === 'jpg' ? { quality: 0.95 } : {}),
      };
      const dataUrl = imageFormat === 'png'
        ? await toPng(table, imageOptions)
        : await toJpeg(table, imageOptions);
      const blob = await (await fetch(dataUrl)).blob();

      const filename = `scheduler-week-${format(currentWeekStart, 'yyyy-MM-dd')}.${imageFormat}`;
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = objectUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.custom(() => (
        <div className="flex w-[min(22rem,calc(100vw-2rem))] items-center gap-3 rounded-xl border border-border bg-card p-2.5 text-card-foreground shadow-xl">
          <img
            src={dataUrl}
            alt="Lịch tuần đã tải xuống"
            className="h-14 w-20 shrink-0 rounded-md border border-border object-cover object-top"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Đã tạo ảnh lịch</p>
            <p className="truncate text-xs text-muted-foreground">{filename}</p>
            <button
              type="button"
              className="mt-1 text-xs font-semibold text-primary underline underline-offset-2"
              onClick={() => window.open(objectUrl, '_blank', 'noopener,noreferrer')}
            >
              Mở ảnh
            </button>
          </div>
        </div>
      ), { duration: 30000 });
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (error) {
      console.error('Unable to export schedule image:', error);
      toast.error('Không thể tải ảnh lịch xuống');
    } finally {
      setIsExporting(false);
    }
  }, [currentWeekStart, isExporting]);

  const downloadSchedulePdf = React.useCallback(async () => {
    const table = scheduleTableRef.current;
    if (!table || isExporting) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(table, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
      });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 8;
      const imageRatio = table.scrollWidth / Math.max(table.scrollHeight, 1);
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;
      let imageWidth = availableWidth;
      let imageHeight = imageWidth / imageRatio;
      if (imageHeight > availableHeight) {
        imageHeight = availableHeight;
        imageWidth = imageHeight * imageRatio;
      }
      pdf.addImage(dataUrl, 'PNG', (pageWidth - imageWidth) / 2, (pageHeight - imageHeight) / 2, imageWidth, imageHeight);
      pdf.save(`scheduler-week-${format(currentWeekStart, 'yyyy-MM-dd')}.pdf`);
      toast.success('Đã tải lịch xuống dạng PDF');
    } catch (error) {
      console.error('Unable to export schedule PDF:', error);
      toast.error('Không thể tải PDF lịch xuống');
    } finally {
      setIsExporting(false);
    }
  }, [currentWeekStart, isExporting]);

  const maxDuration = (hour: number) => Math.min(12, endHour - hour + 1);

  return (
    <div id="schedule-scroll-container" className="w-full overflow-x-auto rounded-xl border transition-colors bg-card border-border">
      <table ref={scheduleTableRef} className="w-full border-collapse table-fixed min-w-[600px]">
        <thead className="sticky top-0 z-30">
          <tr className="bg-muted/95 backdrop-blur">
            <th className="w-14 md:w-20 border p-2 text-[10px] font-black uppercase tracking-wider sticky left-0 z-30 bg-card border-border text-muted-foreground">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mx-auto h-7 w-7 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    aria-label="Tải lịch xuống"
                    title="Tải lịch xuống"
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-32">
                  <DropdownMenuItem onClick={() => void downloadScheduleImage('png')}>
                    Tải PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void downloadScheduleImage('jpg')}>
                    Tải JPG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void downloadSchedulePdf()}>
                    Tải PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </th>
            {daysOfCurrentWeek.map((day, i) => (
              <th key={i} className={cn(
                "border p-2 text-[10px] md:text-xs font-black uppercase tracking-tight border-border text-foreground bg-muted/95",
                isSameDay(day, new Date()) && "bg-primary/10 text-primary"
              )}>
                <span className="hidden md:inline">{dayLabels[i]}</span>
                <span className="md:hidden">{dayShortLabels[i]}</span>
                <div className="text-[10px] opacity-50">{format(day, 'd/M')}</div>
                {showLunarCalendar && (
                  <div className="text-[10px] text-slate-400 dark:text-slate-400 opacity-80">{getLunarLabel(day)}</div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map(hour => (
            <tr key={hour} className="h-10 md:h-12">
              <td className="border text-center font-bold text-[10px] md:text-xs sticky left-0 z-20 bg-muted/50 border-border text-muted-foreground">
                {hour}:00
              </td>
              {daysOfCurrentWeek.map((day, dayIndex) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const plan = planMap.get(`${dayKey}#${hour}`);
                const isPartOfPreviousPlan = occupiedHoursMap.has(`${dayKey}#${hour}`);

                return (
                  <ScheduleCell
                    key={dayIndex}
                    dayKey={dayKey}
                    dayIndex={dayIndex}
                    hour={hour}
                    plan={plan}
                    isPartOfPreviousPlan={isPartOfPreviousPlan}
                    day={day}
                    handleUnifiedClick={handleUnifiedClick}
                    handleOpenEdit={handleOpenEdit}
                    t={t}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:rounded-2xl border-none max-w-xs bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground text-base">Bạn có chắc chắn muốn xóa kế hoạch này?</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmOpen(false)} className="text-muted-foreground">
              Không.
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDeletePlan} className="bg-red-600 hover:bg-red-700 text-white">
              Xóa đi!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="sm:rounded-2xl border-none max-w-sm bg-card"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {plans.some(p => p.id === editingPlan?.id) ? t('editPlan') : t('addPlan')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingPlan && `${formatPlanTime(editingPlan.startHour, editingPlan.startMinute ?? 0)} — ${format(new Date(editingPlan.date), 'EEE, d/M')}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="title" className="text-right text-xs font-bold text-muted-foreground">
                {t('title')}
              </Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="col-span-3 font-semibold bg-muted/50 border-border"
                placeholder={t('enterTask')}
                readOnly={typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches && !allowTextInput}
                onPointerDown={handleTextFieldInteraction}
                onFocus={handleTextFieldInteraction}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              />
            </div>
            <div className="grid grid-cols-2 items-end gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">
                  {t('startHour')}
                </Label>
                <Select
                  value={String(newStartMinute)}
                  onValueChange={(v) => setNewStartMinute(Number(v))}
                >
                  <SelectTrigger className="w-full bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {START_MINUTE_OPTIONS.map((minute) => (
                      <SelectItem key={minute} value={String(minute)}>{String(minute).padStart(2, '0')} phút</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">
                  {t('duration')}
                </Label>
                <Select
                  value={String(newDuration)}
                  onValueChange={(v) => setNewDuration(Number(v))}
                >
                  <SelectTrigger className="w-full bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: editingPlan ? maxDuration(editingPlan.startHour) : 8 }, (_, i) => i + 1).map(h => (
                      <SelectItem key={h} value={String(h)}>{h} {t('hours_suffix')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-end text-[11px] text-muted-foreground">
              {formatPlanTime(editingPlan?.startHour ?? 0, newStartMinute)} → {formatPlanTime((editingPlan?.startHour ?? 0) + newDuration, 0)}
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right text-xs font-bold text-muted-foreground">
                {t('color')}
              </Label>
              <div className="col-span-3 flex gap-2 flex-wrap">
                {(Object.keys(COLOR_MAP) as PlanColor[]).map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-all hover:scale-110",
                      COLOR_MAP[color],
                      "border-border",
                      newColor === color && "ring-2 ring-primary ring-offset-2 scale-110"
                    )}
                    onClick={() => {
                      setNewColor(color);
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right text-xs font-bold text-muted-foreground">
                {t('applyMode')}
              </Label>
              <div className="col-span-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={newApplyMode === 'day' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => {
                    setNewApplyMode('day');
                    if (!newApplyUntil) {
                      setNewApplyUntil(defaultApplyUntilDate);
                    }
                  }}
                >
                  {t('applyToDay')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={newApplyMode === 'week' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => {
                    setNewApplyMode('week');
                    if (!newApplyUntil) {
                      setNewApplyUntil(defaultApplyUntilDate);
                    }
                  }}
                >
                  {t('applyToWeek')}
                </Button>
              </div>
            </div>
            {newApplyMode === 'day' && (
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right text-xs font-bold text-muted-foreground">
                  {t('applyDailyUntil')}
                </Label>
                <div className="col-span-3 flex gap-2 items-center">
                  <Input type="date" value={newApplyUntil || ''} onChange={(e) => setNewApplyUntil(e.target.value || undefined)} className="w-44 bg-muted/50 border-border" />
                </div>
              </div>
            )}
            {newApplyMode === 'week' && (
              <>
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label className="text-right text-xs font-bold text-muted-foreground">
                    {t('applyWeeklyEvery')}
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input type="number" value={newApplyWeekInterval} onChange={(e) => setNewApplyWeekInterval(Number(e.target.value)||1)} className="w-20 bg-muted/50 border-border" />
                    <span className="text-xs text-muted-foreground">{t('weeks')}</span>
                    <span className="ml-auto text-xs font-medium text-muted-foreground">{t('week')} {displayWeekTarget}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label className="text-right text-xs font-bold text-muted-foreground">
                    {t('applyWeeklyTo')}
                  </Label>
                  <div className="col-span-3 flex gap-2 flex-wrap">
                    {WEEK_DAYS.map((d: WeekDay) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setNewApplyWeekDays((prev) => prev.includes(d) ? prev.filter((x: WeekDay) => x !== d) : [...prev, d])}
                        className={cn("px-2 py-1 rounded-md border", newApplyWeekDays.includes(d) ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border-border')}
                      >
                        {d.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="grid grid-cols-4 items-start gap-3">
              <Label className="text-right text-xs font-bold pt-2 text-muted-foreground">
                {t('notes')}
              </Label>
              <Textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                rows={2}
                readOnly={typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches && !allowTextInput}
                onPointerDown={handleTextFieldInteraction}
                onFocus={handleTextFieldInteraction}
                className="col-span-3 text-xs resize-none bg-muted/50 border-border placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between w-full flex-row gap-2">
            {plans.some(p => p.id === editingPlan?.id) && (
              <div className="flex items-center">
                <Button variant="destructive" size="sm" onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 flex items-center gap-2 px-4 py-2">
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">{t('delete')}</span>
                </Button>
              </div>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground">
                {t('cancel')}
              </Button>
              <Button type="button" onClick={handleSave} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground z-60 pointer-events-auto">
                {t('save')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const ScheduleGrid = React.memo(ScheduleGridComponent);
