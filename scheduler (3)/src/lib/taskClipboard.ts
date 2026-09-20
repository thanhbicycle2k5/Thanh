import { format } from 'date-fns';
import { Plan } from '../types';
import { formatPlanTime } from './taskTime';

export type CopiedTask = Pick<Plan, 'title' | 'startMinute' | 'duration' | 'color' | 'notes'>;

export const getTaskClipboardText = (plan: Pick<Plan, 'title' | 'date' | 'startHour' | 'startMinute' | 'duration' | 'notes'>) => {
  const start = formatPlanTime(plan.startHour, plan.startMinute ?? 0);
  const end = formatPlanTime(plan.startHour + plan.duration, 0);
  const dateText = plan.date ? format(new Date(`${plan.date}T00:00:00`), 'dd/MM/yyyy') : '';
  const datePart = dateText ? `, ${dateText}` : '';
  return `[${plan.title}], [${start} - ${end}${datePart}],${plan.notes ? ` [${plan.notes}]` : ''}`;
};

export const parsePlainTask = (text: string): CopiedTask | null => {
  const match = text.match(/^\[([\s\S]*?)\], \[(\d{1,2}):(\d{2}) - (\d{1,2}):(\d{2})(?:, (\d{1,2}\/\d{1,2}\/\d{4}))?\](?:, \[([\s\S]*)\])?$/);
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
