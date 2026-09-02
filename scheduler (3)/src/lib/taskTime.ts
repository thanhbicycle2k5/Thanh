import { Plan } from '../types';

export const START_MINUTE_OPTIONS = [0, 15, 30, 45] as const;
export const REMINDER_LEAD_MINUTES = 15;

export const formatPlanTime = (hour: number, minute: number = 0) => {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

export const getPlanStartDate = (plan: Pick<Plan, 'date' | 'startHour' | 'startMinute'>) => {
  const start = new Date(plan.date);
  start.setHours(plan.startHour, plan.startMinute ?? 0, 0, 0);
  return start;
};

export const getPlanReminderDate = (plan: Pick<Plan, 'date' | 'startHour' | 'startMinute'>) => {
  return new Date(getPlanStartDate(plan).getTime() - REMINDER_LEAD_MINUTES * 60 * 1000);
};

export const isWithinReminderWindow = (minutesUntilStart: number) => {
  if (!Number.isFinite(minutesUntilStart)) {
    return false;
  }

  return minutesUntilStart >= 14 && minutesUntilStart <= 15;
};

export const getPlanEndMinutes = (plan: Pick<Plan, 'startHour' | 'startMinute' | 'duration'>) => {
  // Keep task end aligned to whole-hour boundaries even when the start minute is not 0.
  // Example: 07:15 + 1 hour = 08:00, not 08:15.
  return (plan.startHour + plan.duration) * 60;
};
