import { addDays, format, startOfWeek } from 'date-fns';
import type { Plan } from '../types';

type RecurringPlan = Pick<
  Plan,
  'date' | 'applyMode' | 'applyUntil' | 'applyWeekInterval' | 'applyWeekDays'
>;

export const toPlanDateTimestamp = (dateKey: string): string =>
  new Date(`${dateKey}T12:00:00`).toISOString();

export const getAppliedOccurrenceDateKeys = (plan: RecurringPlan): string[] => {
  const baseDate = new Date(plan.date);
  if (Number.isNaN(baseDate.getTime())) return [];

  const baseDateKey = format(baseDate, 'yyyy-MM-dd');

  if (plan.applyMode === 'day' && plan.applyUntil) {
    const endDate = new Date(`${plan.applyUntil}T00:00:00`);
    if (Number.isNaN(endDate.getTime())) return [];

    const dates: string[] = [];
    for (
      let date = addDays(new Date(`${baseDateKey}T00:00:00`), 1);
      date <= endDate;
      date = addDays(date, 1)
    ) {
      dates.push(format(date, 'yyyy-MM-dd'));
    }
    return dates;
  }

  if (plan.applyMode === 'week' && plan.applyWeekDays?.length) {
    const interval = Math.max(1, Math.floor(Number(plan.applyWeekInterval) || 1));
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
    const targetWeekStart = addDays(weekStart, interval * 7);
    const weekdayIndexes = [...new Set(plan.applyWeekDays
      .map((day) => ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(day))
      .filter((index) => index >= 0))]
      .sort((left, right) => left - right);

    return weekdayIndexes.map((weekdayIndex) => (
      format(addDays(targetWeekStart, weekdayIndex), 'yyyy-MM-dd')
    ));
  }

  return [];
};
