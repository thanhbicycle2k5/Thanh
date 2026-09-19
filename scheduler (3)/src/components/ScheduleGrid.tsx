import * as React from 'react';
import { 
  format, 
  addDays, 
  isSameDay,
  getISOWeek,
} from 'date-fns';
import { Plan, PlanColor, Language, Theme, TaskApplyMode } from '../types';
import { cn } from '@/lib/utils';
import { Plus, Edit2, Trash2, Clock3, Share2, ExternalLink, Clipboard, Copy } from 'lucide-react';
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
import { getColorForClickCount, shouldSkipGeneratedDate } from '../lib/taskColor';
import type { SharedScheduleLink } from '../lib/firebase';

const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];
type ExportPreview = {
  dataUrl: string;
  objectUrl: string;
  blob: Blob;
  filename: string;
  kind: 'image' | 'pdf';
};
type SharedScheduleResult = { id: string; url: string };
type PendingMove = {
  plan: Plan;
  conflictingPlan: Plan;
  targetDay: string;
  targetHour: number;
};

const COLOR_MAP: Record<PlanColor, string> = {
  default: 'grayscale',
  green: 'text-[#000]',
  yellow: 'text-[#000]',
  gray: 'text-[#fff]',
  red: 'text-[#fff]',
  blue: 'text-[#fff]',
  pink: 'text-[#000]',
};

const PLAN_BACKGROUND_COLORS: Record<PlanColor, string> = {
  default: '#FFFFFF',
  green: '#92D050',
  yellow: '#FFFF00',
  gray: '#7F7F7F',
  red: '#FF0000',
  blue: '#0070C0',
  pink: '#FF69B4',
};

const hexToRgba = (hex: string, alpha: number) => {
  const safeHex = hex.replace('#', '');
  const normalized = safeHex.length === 3
    ? safeHex.split('').map((char) => char + char).join('')
    : safeHex;

  const bigint = Number.parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

async function shareOrOpenFile(blob: Blob, filename: string, objectUrl: string) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }
  window.open(objectUrl, '_blank', 'noopener,noreferrer');
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
    }
  }

  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('Clipboard is unavailable');
}

const TASK_CLIPBOARD_TYPE = 'application/x-task2goal-task';

type CopiedTask = Pick<Plan, 'title' | 'startMinute' | 'duration' | 'color' | 'notes'>;

const getTaskClipboardText = (plan: Plan) => {
  const start = formatPlanTime(plan.startHour, plan.startMinute ?? 0);
  const end = formatPlanTime(plan.startHour + plan.duration, 0);
  return `[${plan.title}], [${start} - ${end}]${plan.notes ? `, [${plan.notes}]` : ''}`;
};

async function copyPlan(plan: Plan) {
  const text = getTaskClipboardText(plan);
  const payload: CopiedTask = {
    title: plan.title,
    startMinute: plan.startMinute ?? 0,
    duration: plan.duration,
    color: plan.color,
    notes: plan.notes,
  };

  if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          [TASK_CLIPBOARD_TYPE]: new Blob([JSON.stringify(payload)], { type: TASK_CLIPBOARD_TYPE }),
        }),
      ]);
      return;
    } catch {
    }
  }

  await copyText(text);
}

const parsePlainTask = (text: string): CopiedTask | null => {
  const match = text.match(/^\[([\s\S]*?)\], \[(\d{1,2}):(\d{2}) - (\d{1,2}):(\d{2})\](?:, \[([\s\S]*)\])?$/);
  if (!match) return null;

  const startHour = Number(match[2]);
  const startMinute = Number(match[3]);
  const endHour = Number(match[4]);
  const endMinute = Number(match[5]);
  const duration = endHour * 60 + endMinute > startHour * 60 + startMinute
    ? Math.ceil((endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60)
    : 1;

  return {
    title: match[1],
    startMinute,
    duration,
    color: 'yellow',
    notes: match[6] || undefined,
  };
};

async function readCopiedTask() {
  if (navigator.clipboard?.read) {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes(TASK_CLIPBOARD_TYPE)) {
          const blob = await item.getType(TASK_CLIPBOARD_TYPE);
          return JSON.parse(await blob.text()) as CopiedTask;
        }
      }
    } catch {
    }
  }

  if (navigator.clipboard?.readText) {
    try {
      return parsePlainTask(await navigator.clipboard.readText());
    } catch {
    }
  }

  return null;
}

async function shareLinkOrCopy(url: string) {
  if (navigator.share) {
    await navigator.share({ title: 'Task2Goal', text: 'Lịch Task2Goal được chia sẻ', url });
    return;
  }
  await copyText(url);
}

interface ScheduleCellProps {
  dayKey: string;
  dayIndex: number;
  hour: number;
  plan?: Plan;
  isPartOfPreviousPlan: boolean;
  day: Date;
  handleUnifiedClick: (date: Date, hour: number, existingPlan?: Plan) => void;
  handlePasteTask: (date: Date, hour: number) => void;
  showPasteAction: boolean;
  handleShowPasteAction: (cellKey: string) => void;
  handleOpenEdit: (plan: Plan, e: React.MouseEvent) => void;
  handlePlanClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  handlePlanPointerDown: (plan: Plan, e: React.PointerEvent<HTMLDivElement>) => void;
  handlePlanPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  handlePlanPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  handlePlanTouchStart: (plan: Plan, e: React.TouchEvent<HTMLDivElement>) => void;
  handlePlanTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  handlePlanTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
  isDragging: boolean;
  isDropTarget: boolean;
  dropTargetHour: number | null;
  t: (key: keyof typeof translations.en) => string;
  boardOpacity: number;
}

const ScheduleCell = React.memo(function ScheduleCell({
  dayKey,
  dayIndex,
  hour,
  plan,
  isPartOfPreviousPlan,
  day,
  handleUnifiedClick,
  handlePasteTask,
  showPasteAction,
  handleShowPasteAction,
  handleOpenEdit,
  handlePlanClick,
  handlePlanPointerDown,
  handlePlanPointerMove,
  handlePlanPointerUp,
  handlePlanTouchStart,
  handlePlanTouchMove,
  handlePlanTouchEnd,
  isDragging,
  isDropTarget,
  dropTargetHour,
  t,
  boardOpacity,
}: ScheduleCellProps) {
  const longPressTimer = React.useRef<number | null>(null);

  if (isPartOfPreviousPlan) return null;

  const effectiveBoardOpacity = boardOpacity === 0 ? 0.12 : Math.min(1, Math.max(0, boardOpacity));
  const cellBackground = plan
    ? PLAN_BACKGROUND_COLORS[plan.color]
    : `color-mix(in srgb, var(--card) ${effectiveBoardOpacity * 100}%, transparent)`;

  return (
    <td
      data-schedule-cell="true"
      data-day={dayKey}
      data-hour={hour}
      rowSpan={plan?.duration || 1}
      className={cn(
        "border p-0 relative group cursor-pointer transition-colors duration-150 border-border",
        plan ? COLOR_MAP[plan.color] : "hover:bg-transparent",
        isDropTarget && "ring-2 ring-inset ring-primary"
      )}
      style={{
        backgroundColor: cellBackground,
        background: cellBackground,
        backgroundImage: 'none',
      }}
      onClick={() => handleUnifiedClick(day, hour)}
      onContextMenu={(e) => {
        if (plan) return;
        e.preventDefault();
        handleShowPasteAction(`${dayKey}#${hour}`);
      }}
      onTouchStart={() => {
        if (plan) return;
        longPressTimer.current = window.setTimeout(() => handleShowPasteAction(`${dayKey}#${hour}`), 600);
      }}
      onTouchEnd={() => {
        if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current);
      }}
      onTouchCancel={() => {
        if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current);
      }}
    >
      {plan ? (
        <div
          className={cn("w-full h-full p-1.5 text-[10px] md:text-xs font-bold flex flex-col items-center justify-center text-center relative leading-tight gap-0.5 cursor-grab touch-pan-x touch-pan-y select-none", (plan.startMinute ?? 0) > 0 && "pt-4", isDragging && "cursor-grabbing opacity-60")}
          onPointerDown={(e) => handlePlanPointerDown(plan, e)}
          onPointerMove={handlePlanPointerMove}
          onPointerUp={handlePlanPointerUp}
          onPointerCancel={handlePlanPointerUp}
          onTouchStart={(e) => handlePlanTouchStart(plan, e)}
          onTouchMove={handlePlanTouchMove}
          onTouchEnd={handlePlanTouchEnd}
          onTouchCancel={handlePlanTouchEnd}
          onContextMenu={(e) => e.preventDefault()}
          onClick={handlePlanClick}
        >
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
            onPointerDown={(e) => e.stopPropagation()}
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
          {showPasteAction && (
            <button
              type="button"
              className="absolute inset-1 z-10 flex items-center justify-center gap-1 rounded-md bg-primary px-1 text-[10px] font-bold text-primary-foreground opacity-100 shadow"
              onClick={(e) => {
                e.stopPropagation();
                handlePasteTask(day, hour);
              }}
            >
              <Clipboard className="h-3 w-3" />
              <span>Dán task</span>
            </button>
          )}
        </div>
      )}
      {isDropTarget && dropTargetHour !== null && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-10 h-1 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_25%,transparent)]"
          style={{
            top: plan
              ? `${Math.min(100, Math.max(0, ((dropTargetHour - hour) / plan.duration) * 100))}%`
              : '0%',
          }}
        />
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
  boardOpacity?: number;
  showLunarCalendar: boolean;
  allPlans?: Plan[];
  sharedLinks?: SharedScheduleLink[];
  onCreateShare?: (startWeek: Date, endWeek: Date, plans: Plan[]) => Promise<SharedScheduleResult>;
  onCancelShare?: (shareId: string) => Promise<void>;
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
  boardOpacity = 1,
  showLunarCalendar,
  allPlans = plans,
  sharedLinks = [],
  onCreateShare,
  onCancelShare,
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
  const [pasteActionCell, setPasteActionCell] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!pasteActionCell) return;

    const timer = window.setTimeout(() => {
      setPasteActionCell(null);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [pasteActionCell]);
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
  const [exportPreview, setExportPreview] = React.useState<ExportPreview | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [shareEndWeek, setShareEndWeek] = React.useState(format(currentWeekStart, 'yyyy-MM-dd'));
  const [shareLink, setShareLink] = React.useState('');
  const [shareId, setShareId] = React.useState('');
  const [isSharing, setIsSharing] = React.useState(false);
  const [draggingPlanId, setDraggingPlanId] = React.useState<string | null>(null);
  const [dragTarget, setDragTarget] = React.useState<{ day: string; hour: number } | null>(null);
  const [pendingMove, setPendingMove] = React.useState<PendingMove | null>(null);
  const dragStateSuppressClick = React.useRef(false);
  const dragStateRef = React.useRef<{
    plan: Plan;
    pointerId: number;
    startX: number;
    startY: number;
    clientX: number;
    clientY: number;
    element: HTMLDivElement;
    timer: number;
    isDragging: boolean;
  } | null>(null);

  const closeExportPreview = React.useCallback(() => {
    setExportPreview((preview) => {
      if (preview) URL.revokeObjectURL(preview.objectUrl);
      return null;
    });
  }, []);

  const confirmExportPreview = React.useCallback(() => {
    if (!exportPreview) return;
    const link = document.createElement('a');
    link.href = exportPreview.objectUrl;
    link.download = exportPreview.filename;
    link.click();
    toast.success(`Đã tải ${exportPreview.filename}`);
    const objectUrl = exportPreview.objectUrl;
    setExportPreview(null);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }, [closeExportPreview, exportPreview]);

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
    return '';
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

  React.useEffect(() => {
    const mainScrollContainer = document.getElementById('main-scroll-container');
    if (!draggingPlanId) {
      document.body.removeAttribute('data-task-dragging');
      return;
    }

    document.body.setAttribute('data-task-dragging', 'true');
    if (!mainScrollContainer) return;

    const previousOverflowY = mainScrollContainer.style.overflowY;
    mainScrollContainer.style.overflowY = 'hidden';
    return () => {
      document.body.removeAttribute('data-task-dragging');
      mainScrollContainer.style.overflowY = previousOverflowY;
    };
  }, [draggingPlanId]);

  const handleTextFieldInteraction = React.useCallback(() => {
    if (typeof window === 'undefined') return;

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile) {
      setAllowTextInput(true);
    }
  }, []);

  const getScheduleTarget = React.useCallback((clientX: number, clientY: number) => {
    const element = document.elementFromPoint(clientX, clientY);
    const cell = element?.closest('td[data-schedule-cell="true"]') as HTMLTableCellElement | null;
    if (!cell?.dataset.day) return null;

    const row = Array.from(document.querySelectorAll('tbody tr[data-schedule-hour]'))
      .find((candidate) => {
        const rect = candidate.getBoundingClientRect();
        return clientY >= rect.top && clientY < rect.bottom;
      }) as HTMLTableRowElement | undefined;
    if (!row?.dataset.scheduleHour) return null;

    return {
      day: cell.dataset.day,
      hour: Number(row.dataset.scheduleHour),
    };
  }, []);

  const autoScrollWhileDragging = React.useCallback((clientX: number, clientY: number) => {
    const scheduleContainer = document.getElementById('schedule-scroll-container');
    const mainScrollContainer = document.getElementById('main-scroll-container');
    const edgeSize = 64;
    const scrollStep = 14;

    if (scheduleContainer) {
      const rect = scheduleContainer.getBoundingClientRect();
      if (clientX < rect.left + edgeSize) {
        scheduleContainer.scrollLeft -= scrollStep;
      } else if (clientX > rect.right - edgeSize) {
        scheduleContainer.scrollLeft += scrollStep;
      }
    }

    if (mainScrollContainer) {
      const rect = mainScrollContainer.getBoundingClientRect();
      if (clientY < rect.top + edgeSize) {
        mainScrollContainer.scrollTop -= scrollStep;
      } else if (clientY > rect.bottom - edgeSize) {
        mainScrollContainer.scrollTop += scrollStep;
      }
    }
  }, []);

  React.useEffect(() => {
    if (!draggingPlanId) return;

    const timer = window.setInterval(() => {
      const state = dragStateRef.current;
      if (!state?.isDragging) return;
      autoScrollWhileDragging(state.clientX, state.clientY);
      setDragTarget(getScheduleTarget(state.clientX, state.clientY));
    }, 50);

    return () => window.clearInterval(timer);
  }, [autoScrollWhileDragging, draggingPlanId, getScheduleTarget]);

  const handlePlanClick = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStateSuppressClick.current) return;
    e.stopPropagation();
    dragStateSuppressClick.current = false;
  }, []);

  const handlePlanPointerDown = React.useCallback((plan: Plan, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if (e.button !== 0) return;

    dragStateSuppressClick.current = false;
    const previous = dragStateRef.current;
    if (previous) window.clearTimeout(previous.timer);

    dragStateRef.current = {
      plan,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      clientX: e.clientX,
      clientY: e.clientY,
      element: e.currentTarget,
      timer: window.setTimeout(() => {
        const state = dragStateRef.current;
        if (!state || state.pointerId !== e.pointerId) return;
        state.isDragging = true;
        state.element.setPointerCapture(state.pointerId);
        setDraggingPlanId(plan.id);
        setDragTarget(getScheduleTarget(state.clientX, state.clientY));
      }, 1000),
      isDragging: false,
    };
  }, [getScheduleTarget]);

  const finishPlanMove = React.useCallback((state: NonNullable<typeof dragStateRef.current>, clientX: number, clientY: number) => {
    const target = getScheduleTarget(clientX, clientY);
    setDragTarget(null);
    if (!target) return;

    const targetDate = new Date(`${target.day}T00:00:00`);
    const targetEndHour = target.hour + state.plan.duration;
    if (targetEndHour > endHour) {
      toast.error('Task không thể vượt quá giờ kết thúc của lịch');
      return;
    }

    const overlappingPlans = plans.filter((plan) => {
      if (plan.id === state.plan.id || !isSameDay(new Date(plan.date), targetDate)) return false;
      const planStart = plan.startHour * 60 + (plan.startMinute ?? 0);
      const planEnd = getPlanEndMinutes(plan);
      const targetStart = target.hour * 60 + (state.plan.startMinute ?? 0);
      const targetEnd = getPlanEndMinutes({
        startHour: target.hour,
        startMinute: state.plan.startMinute ?? 0,
        duration: state.plan.duration,
      });
      return planStart < targetEnd && targetStart < planEnd;
    });

    const conflictingPlan = overlappingPlans[0];
    if (conflictingPlan) {
      const conflictingEndHour = getPlanEndMinutes(conflictingPlan) / 60;

      if (target.hour === conflictingPlan.startHour) {
        if (targetEndHour >= conflictingEndHour) {
          toast.error('Task mới chiếm toàn bộ khung giờ của task hiện tại');
          return;
        }
        setPendingMove({
          plan: state.plan,
          conflictingPlan,
          targetDay: target.day,
          targetHour: target.hour,
        });
        return;
      }

      onUpdatePlan({
        ...conflictingPlan,
        duration: target.hour - conflictingPlan.startHour,
      });
    }

    if (state.plan.startHour === target.hour && isSameDay(new Date(state.plan.date), targetDate)) return;

    onUpdatePlan({
      ...state.plan,
      date: targetDate.toISOString(),
      startHour: target.hour,
    });
  }, [endHour, getScheduleTarget, onUpdatePlan, plans]);

  const handlePlanPointerMove = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const state = dragStateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    state.clientX = e.clientX;
    state.clientY = e.clientY;

    if (!state.isDragging) {
      return;
    }

    e.preventDefault();
    autoScrollWhileDragging(e.clientX, e.clientY);
    setDragTarget(getScheduleTarget(e.clientX, e.clientY));
  }, [autoScrollWhileDragging, getScheduleTarget]);

  const handlePlanPointerUp = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const state = dragStateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;

    window.clearTimeout(state.timer);
    dragStateRef.current = null;

    if (!state.isDragging) return;

    e.preventDefault();
    dragStateSuppressClick.current = true;
    setDraggingPlanId(null);
    finishPlanMove(state, e.clientX, e.clientY);
  }, [finishPlanMove]);

  const handlePlanTouchStart = React.useCallback((plan: Plan, e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;

    const previous = dragStateRef.current;
    if (previous) window.clearTimeout(previous.timer);

    dragStateSuppressClick.current = false;
    dragStateRef.current = {
      plan,
      pointerId: touch.identifier,
      startX: touch.clientX,
      startY: touch.clientY,
      clientX: touch.clientX,
      clientY: touch.clientY,
      element: e.currentTarget,
      timer: window.setTimeout(() => {
        const state = dragStateRef.current;
        if (!state || state.pointerId !== touch.identifier) return;
        state.isDragging = true;
        setDraggingPlanId(plan.id);
        setDragTarget(getScheduleTarget(state.clientX, state.clientY));
      }, 1000),
      isDragging: false,
    };
  }, [getScheduleTarget]);

  const handlePlanTouchMove = React.useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    const touch = Array.from(e.touches).find((item) => item.identifier === state?.pointerId);
    if (!state || !touch) return;

    state.clientX = touch.clientX;
    state.clientY = touch.clientY;
    if (!state.isDragging) return;

    e.preventDefault();
    autoScrollWhileDragging(touch.clientX, touch.clientY);
    setDragTarget(getScheduleTarget(touch.clientX, touch.clientY));
  }, [autoScrollWhileDragging, getScheduleTarget]);

  const handlePlanTouchEnd = React.useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state) return;

    const touch = Array.from(e.changedTouches).find((item) => item.identifier === state.pointerId);
    if (!touch) return;

    window.clearTimeout(state.timer);
    dragStateRef.current = null;
    if (!state.isDragging) return;

    e.preventDefault();
    dragStateSuppressClick.current = true;
    setDraggingPlanId(null);
    finishPlanMove(state, touch.clientX, touch.clientY);
  }, [finishPlanMove]);

  const confirmPendingMove = React.useCallback(() => {
    if (!pendingMove) return;

    const targetEndHour = pendingMove.targetHour + pendingMove.plan.duration;
    const conflictingEndHour = getPlanEndMinutes(pendingMove.conflictingPlan) / 60;
    const remainingDuration = conflictingEndHour - targetEndHour;
    if (remainingDuration <= 0) {
      toast.error('Task mới chiếm toàn bộ khung giờ của task hiện tại');
      setPendingMove(null);
      return;
    }

    onUpdatePlan({
      ...pendingMove.conflictingPlan,
      startHour: targetEndHour,
      startMinute: 0,
      duration: remainingDuration,
    });
    onUpdatePlan({
      ...pendingMove.plan,
      date: new Date(`${pendingMove.targetDay}T00:00:00`).toISOString(),
      startHour: pendingMove.targetHour,
    });
    setPendingMove(null);
  }, [onUpdatePlan, pendingMove]);

  const handlePasteTask = React.useCallback(async (date: Date, hour: number) => {
    try {
      const copiedTask = await readCopiedTask();
      if (!copiedTask) {
        toast.error('Không tìm thấy task đã sao chép');
        return;
      }

      const dateIso = date.toISOString();
      const duration = Math.max(1, copiedTask.duration || 1);
      const pastedEndHour = hour + duration;
      if (pastedEndHour > endHour) {
        toast.error('Task không thể vượt quá giờ kết thúc của lịch');
        return;
      }

      const overlaps = plans.some((plan) => {
        if (!isSameDay(new Date(plan.date), date)) return false;
        const planStart = plan.startHour * 60 + (plan.startMinute ?? 0);
        const planEnd = getPlanEndMinutes(plan);
        const pastedStart = hour * 60 + (copiedTask.startMinute ?? 0);
        const pastedEnd = getPlanEndMinutes({ startHour: hour, startMinute: copiedTask.startMinute ?? 0, duration });
        return planStart < pastedEnd && pastedStart < planEnd;
      });

      if (overlaps) {
        toast.error('Ô này hoặc thời lượng task đã có task khác');
        return;
      }

      await onAddPlan({
        id: crypto.randomUUID(),
        title: copiedTask.title,
        date: dateIso,
        startHour: hour,
        startMinute: copiedTask.startMinute ?? 0,
        duration,
        color: copiedTask.color,
      });
      toast.success('Đã dán task');
    } catch (error) {
      console.error('Unable to paste task:', error);
      toast.error('Không thể dán task từ clipboard');
    }
  }, [onAddPlan, plans, endHour]);

  const handleUnifiedClick = React.useCallback((date: Date, hour: number, existingPlan?: Plan) => {
    if (dragStateSuppressClick.current) {
      dragStateSuppressClick.current = false;
      return;
    }

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
      const nextColor = getColorForClickCount(existing.color, clickCount.current);
      const updated = { ...existing, color: nextColor };

      if (clickCount.current === 1) {
        onUpdatePlan(updated);
      } else if (clickCount.current === 2) {
        onUpdatePlan(updated);
        if (existing.color !== 'green') {
          onPlanTurnGreen?.(updated);
        }
      } else if (clickCount.current >= 3) {
        onUpdatePlan(updated);
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

    const previousPlan = allPlans.find(p => p.id === editingPlan.id) ?? editingPlan;
    const isNew = !plans.some(p => p.id === editingPlan.id);
    const recurrenceGroupId = newApplyMode !== 'none'
      ? previousPlan.recurrenceGroupId ?? (isNew ? crypto.randomUUID() : undefined)
      : undefined;
    const basePlan = { ...editingPlan, title: newTitle, color: newColor, startMinute: newStartMinute, duration: newDuration, applyMode: newApplyMode, applyDays: newApplyDays.length? newApplyDays: undefined, applyWeekInterval: newApplyWeekInterval || undefined, applyWeekDays: newApplyWeekDays.length? newApplyWeekDays: undefined, applyUntil: newApplyUntil || undefined, recurrenceGroupId, notes: newNotes || undefined };
    const wasGreen = previousPlan.color === 'green';
    const isDisablingRecurrence = !isNew && previousPlan.applyMode !== 'none' && newApplyMode === 'none';

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

    setIsDialogOpen(false);

    try {
      const baseDateKey = basePlan.date.slice(0, 10);
      const addGeneratedDayPlan = async (candidateDate: Date) => {
        const candidateKey = format(candidateDate, 'yyyy-MM-dd');
        if (candidateKey < baseDateKey) {
          return;
        }
        if (!overlaps(candidateKey, basePlan.startHour, basePlan.startMinute ?? 0, basePlan.duration)) {
          const newPlan = { ...basePlan, id: crypto.randomUUID(), date: candidateKey };
          await onAddPlan(newPlan);
        }
      };

      const addGeneratedWeekPlan = async (candidateDate: Date) => {
        const candidateKey = format(candidateDate, 'yyyy-MM-dd');
        if (candidateKey < baseDateKey) {
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
      } else {
        await onUpdatePlan(basePlan);
      }

      if (isDisablingRecurrence) {
        const previousGroupId = previousPlan.recurrenceGroupId;
        const generatedPlans = allPlans.filter((plan) => {
          if (plan.id === basePlan.id) return false;
          if (previousGroupId) return plan.recurrenceGroupId === previousGroupId;

          return plan.applyMode === previousPlan.applyMode
            && plan.applyUntil === previousPlan.applyUntil
            && plan.title === previousPlan.title
            && plan.startHour === previousPlan.startHour
            && (plan.startMinute ?? 0) === (previousPlan.startMinute ?? 0)
            && plan.duration === previousPlan.duration
            && plan.color === previousPlan.color;
        });

        generatedPlans.forEach((plan) => onDeletePlan(plan.id));
      }

      if (basePlan.applyMode === 'day' && basePlan.applyUntil) {
        let cur = new Date(`${baseDateKey}T00:00:00`);
        const end = new Date(`${basePlan.applyUntil}T00:00:00`);
        cur.setHours(basePlan.startHour, basePlan.startMinute ?? 0, 0, 0);
        cur.setDate(cur.getDate() + 1);
        while (cur <= end) {
          const candidate = new Date(cur);
          candidate.setHours(basePlan.startHour, basePlan.startMinute ?? 0, 0, 0);
          await addGeneratedDayPlan(candidate);
          cur.setDate(cur.getDate() + 1);
        }
      }

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
            if (shouldSkipGeneratedDate(basePlan.date, candidate)) {
              continue;
            }
            await addGeneratedWeekPlan(candidate);
          }
        }
      }

      if (!isNew && !wasGreen && newColor === 'green') {
        onPlanTurnGreen?.(basePlan);
      } else if (isNew && newColor === 'green') {
        onPlanTurnGreen?.(basePlan);
      }

    } catch (e) {
      console.error('Error saving plan:', e);
    }
  };

  const handleDelete = () => {
    if (editingPlan) {
      setDeleteConfirmOpen(true);
    }
  };

  const handleCopy = async () => {
    if (!editingPlan) return;

    try {
      await copyPlan({
        ...editingPlan,
        title: newTitle,
        startMinute: newStartMinute,
        duration: newDuration,
        color: newColor,
        notes: newNotes || undefined,
      });
      toast.success('Đã sao chép task');
    } catch (error) {
      console.error('Unable to copy task:', error);
      toast.error('Không thể sao chép task');
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

      const filename = `task2goal-week-${format(currentWeekStart, 'yyyy-MM-dd')}.${imageFormat}`;
      const objectUrl = URL.createObjectURL(blob);
      setExportPreview({ dataUrl, objectUrl, blob, filename, kind: 'image' });
    } catch (error) {
      console.error('Unable to export schedule image:', error);
      toast.error('Không thể tải ảnh lịch xuống');
    } finally {
      setIsExporting(false);
    }
  }, [currentWeekStart, isExporting]);

  const shareWeekOptions = React.useMemo(
    () => Array.from({ length: 12 }, (_, index) => addDays(currentWeekStart, index * 7)),
    [currentWeekStart]
  );

  const createShareLink = async () => {
    if (!onCreateShare) return;
    const endWeek = new Date(`${shareEndWeek}T00:00:00`);
    setIsSharing(true);
    try {
      const shared = await onCreateShare(currentWeekStart, endWeek, allPlans);
      setShareId(shared.id);
      setShareLink(shared.url);
    } catch (error) {
      console.error('Unable to create shared schedule:', error);
      toast.error('Không thể tạo link chia sẻ lịch');
    } finally {
      setIsSharing(false);
    }
  };

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
      const filename = `task2goal-week-${format(currentWeekStart, 'yyyy-MM-dd')}.pdf`;
      const blob = pdf.output('blob');
      const objectUrl = URL.createObjectURL(blob);
      setExportPreview({ dataUrl, objectUrl, blob, filename, kind: 'pdf' });
    } catch (error) {
      console.error('Unable to export schedule PDF:', error);
      toast.error('Không thể tải PDF lịch xuống');
    } finally {
      setIsExporting(false);
    }
  }, [currentWeekStart, isExporting]);

  const maxDuration = (hour: number) => Math.min(12, endHour - hour + 1);
  const visibleBoardOpacity = Number.isFinite(boardOpacity)
    ? Math.min(1, Math.max(0, boardOpacity))
    : 1;
  const effectiveBoardOpacity = visibleBoardOpacity === 0 ? 0.12 : visibleBoardOpacity;
  const translucentCard = `color-mix(in srgb, var(--card) ${Math.max(2, effectiveBoardOpacity * 100)}%, transparent)`;

  return (
    <div
      id="schedule-scroll-container"
      className="relative w-full overflow-x-auto rounded-xl border transition-colors border-border"
      style={{ backgroundColor: 'transparent' }}
    >
      <table ref={scheduleTableRef} className="w-full border-collapse table-fixed min-w-[600px] !bg-transparent" style={{ background: 'transparent', backgroundColor: 'transparent' }}>
        <thead className="sticky top-0 z-30">
          <tr className="backdrop-blur" style={{ backgroundColor: translucentCard }}>
            <th className="w-14 md:w-20 border p-2 text-[10px] font-black uppercase tracking-wider sticky left-0 z-30 border-border text-muted-foreground" style={{ backgroundColor: translucentCard }}>
              <div className="flex items-center justify-center gap-1">
                <Clock3 className="h-4 w-4" aria-label="Thời gian" />
              </div>
            </th>
            {daysOfCurrentWeek.map((day, i) => (
              <th key={i} className={cn(
                "border p-2 text-[10px] md:text-xs font-black uppercase tracking-tight border-border text-foreground",
                isSameDay(day, new Date()) && "bg-primary/10 text-primary border-primary/50 shadow-[inset_0_-2px_0_var(--primary)]"
              )} style={{ backgroundColor: isSameDay(day, new Date()) ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : translucentCard }}>
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
        <tbody style={{ background: 'transparent', backgroundColor: 'transparent' }}>
          {HOURS.map(hour => (
            <tr key={hour} data-schedule-hour={hour} className="h-10 md:h-12" style={{ background: 'transparent', backgroundColor: 'transparent' }}>
              <td className="border text-center font-black text-[10px] md:text-xs sticky left-0 z-20 border-border text-foreground" style={{ backgroundColor: translucentCard }}>
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
                    handlePasteTask={handlePasteTask}
                    showPasteAction={pasteActionCell === `${dayKey}#${hour}`}
                    handleShowPasteAction={setPasteActionCell}
                    handleOpenEdit={handleOpenEdit}
                    handlePlanClick={handlePlanClick}
                    handlePlanPointerDown={handlePlanPointerDown}
                    handlePlanPointerMove={handlePlanPointerMove}
                    handlePlanPointerUp={handlePlanPointerUp}
                    handlePlanTouchStart={handlePlanTouchStart}
                    handlePlanTouchMove={handlePlanTouchMove}
                    handlePlanTouchEnd={handlePlanTouchEnd}
                    isDragging={draggingPlanId === plan?.id}
                    isDropTarget={dragTarget?.day === dayKey && dragTarget.hour >= hour && dragTarget.hour < hour + (plan?.duration || 1)}
                    dropTargetHour={dragTarget?.day === dayKey ? dragTarget.hour : null}
                    t={t}
                    boardOpacity={visibleBoardOpacity}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {onCreateShare && <div className="flex justify-end border-t border-border bg-muted/30 p-1.5">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary" aria-label="Chia sẻ lịch" title="Chia sẻ lịch" onClick={() => { setShareEndWeek(format(currentWeekStart, 'yyyy-MM-dd')); setShareLink(''); setShareId(''); setShareDialogOpen(true); }}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>}

      <Dialog open={exportPreview !== null} onOpenChange={(open) => { if (!open) closeExportPreview(); }}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">Xem trước file tải xuống</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Kiểm tra lịch rồi bấm Tải xuống để lưu file vào máy.
            </DialogDescription>
          </DialogHeader>
          {exportPreview && (
            <>
              <div className="max-h-[60vh] overflow-auto rounded-lg border border-border bg-white p-2">
                <img src={exportPreview.dataUrl} alt="Xem trước lịch tuần" className="h-auto w-full" />
              </div>
              <p className="truncate text-xs text-muted-foreground">{exportPreview.filename}</p>
              <DialogFooter className="gap-2 sm:justify-between">
                <Button type="button" variant="ghost" onClick={closeExportPreview}>Hủy</Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => void shareOrOpenFile(exportPreview.blob, exportPreview.filename, exportPreview.objectUrl)}>
                    Chia sẻ
                  </Button>
                  <Button type="button" onClick={confirmExportPreview}>
                    Tải xuống
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>Chia sẻ lịch</DialogTitle>
            <DialogDescription>Chọn tuần cuối. Tất cả tuần từ tuần hiện tại đến tuần này sẽ nằm trong cùng một link chỉ xem.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="share-end-week">Chia sẻ đến</Label>
            <Select value={shareEndWeek} onValueChange={setShareEndWeek}>
              <SelectTrigger id="share-end-week"><SelectValue /></SelectTrigger>
              <SelectContent>
                {shareWeekOptions.map((week) => <SelectItem key={week.toISOString()} value={format(week, 'yyyy-MM-dd')}>Tuần {format(week, 'w')} ({format(week, 'd/M')})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {shareLink && <div className="space-y-2"><Label htmlFor="share-link">Link chia sẻ mới tạo</Label><Input id="share-link" readOnly value={shareLink} onFocus={(event) => event.currentTarget.select()} /><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="flex-1" onClick={() => window.location.assign(shareLink)}><ExternalLink className="mr-1.5 h-4 w-4" />Mở link</Button><Button type="button" className="flex-1" onClick={() => { void shareLinkOrCopy(shareLink).then(() => toast.success(navigator.share ? 'Đã mở menu chia sẻ' : 'Đã sao chép link')).catch(() => toast.error('Không thể chia sẻ link')); }}>{navigator.share ? 'Chia sẻ link' : 'Sao chép link'}</Button>{onCancelShare && <Button type="button" variant="destructive" onClick={async () => { await onCancelShare(shareId); setShareLink(''); setShareId(''); toast.success('Đã hủy chia sẻ'); }}>Hủy chia sẻ</Button>}</div></div>}
          {sharedLinks.length > 0 && <div className="space-y-2 border-t border-border pt-3"><Label>Link đã tạo</Label>{sharedLinks.map((link) => { const url = `${window.location.origin}/?share=${encodeURIComponent(link.id)}`; return <div key={link.id} className="space-y-2 rounded-md border border-border p-2"><div className="flex items-center justify-between gap-2 text-xs"><span className="truncate text-muted-foreground">Tuần {link.startWeek} đến {link.endWeek}</span><span className="shrink-0 text-muted-foreground">Hết hạn {format(new Date(link.expiresAt.toMillis()), 'd/M/yyyy HH:mm')}</span></div><Input readOnly value={url} onFocus={(event) => event.currentTarget.select()} /><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="flex-1" onClick={() => window.location.assign(url)}><ExternalLink className="mr-1.5 h-4 w-4" />Mở link</Button><Button type="button" className="flex-1" onClick={() => { void shareLinkOrCopy(url).then(() => toast.success(navigator.share ? 'Đã mở menu chia sẻ' : 'Đã sao chép link')).catch(() => toast.error('Không thể chia sẻ link')); }}>{navigator.share ? 'Chia sẻ link' : 'Sao chép link'}</Button>{onCancelShare && <Button type="button" variant="destructive" onClick={async () => { await onCancelShare(link.id); if (link.id === shareId) { setShareLink(''); setShareId(''); } toast.success('Đã hủy chia sẻ'); }}>Hủy chia sẻ</Button>}</div></div>; })}</div>}
          {!shareLink && <Button type="button" className="w-full" disabled={isSharing} onClick={() => void createShareLink()}>{isSharing ? 'Đang tạo link...' : 'Tạo link chia sẻ'}</Button>}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:rounded-2xl border-border max-w-xs bg-card">
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

      <Dialog open={pendingMove !== null} onOpenChange={(open) => { if (!open) setPendingMove(null); }}>
        <DialogContent className="sm:rounded-2xl border-border max-w-sm bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground text-base">Xác nhận thay đổi lịch?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {pendingMove && `Task "${pendingMove.conflictingPlan.title || t('enterTask')}" đang bắt đầu lúc ${formatPlanTime(pendingMove.conflictingPlan.startHour, pendingMove.conflictingPlan.startMinute ?? 0)}. Task mới sẽ được chèn vào và task hiện tại sẽ lùi đến sau task mới.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setPendingMove(null)}>Hủy</Button>
            <Button type="button" onClick={confirmPendingMove}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="sm:rounded-2xl border-border max-w-sm bg-card"
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
                    type="button"
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-all hover:scale-110",
                      COLOR_MAP[color],
                      "border-border",
                      newColor === color && "ring-2 ring-primary ring-offset-2 scale-110"
                    )}
                    style={{ backgroundColor: PLAN_BACKGROUND_COLORS[color] }}
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
                    setNewApplyMode((prev) => {
                      const nextMode = prev === 'day' ? 'none' : 'day';
                      if (nextMode === 'day' && !newApplyUntil) {
                        setNewApplyUntil(defaultApplyUntilDate);
                      }
                      return nextMode;
                    });
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
                    setNewApplyMode((prev) => {
                      const nextMode = prev === 'week' ? 'none' : 'week';
                      if (nextMode === 'week' && !newApplyUntil) {
                        setNewApplyUntil(defaultApplyUntilDate);
                      }
                      return nextMode;
                    });
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
                <Button type="button" variant="outline" size="icon" onClick={() => void handleCopy()} className="mr-2 h-8 w-8" aria-label="Sao chép task" title="Sao chép task">
                  <Copy className="h-4 w-4" />
                </Button>
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
