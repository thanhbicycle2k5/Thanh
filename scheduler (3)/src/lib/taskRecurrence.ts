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
    const rawWeekCount = Number(plan.applyWeekInterval);
    const weekCount = Number.isFinite(rawWeekCount) ? Math.max(0, Math.floor(rawWeekCount)) : 0;
    if (weekCount === 0) return [];

    const baseDateAtMidnight = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
    );
    const baseDateWeekStart = startOfWeek(baseDateAtMidnight, { weekStartsOn: 1 });
    const weekdayIndexes = [...new Set(plan.applyWeekDays
      .map((day) => ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(day))
      .filter((index) => index >= 0))]
      .sort((left, right) => left - right);

    const dateKeys: string[] = [];
    for (let weekOffset = 1; weekOffset <= weekCount; weekOffset += 1) {
      const weekStart = addDays(baseDateWeekStart, weekOffset * 7);
      for (const weekdayIndex of weekdayIndexes) {
        const candidateDate = addDays(weekStart, weekdayIndex);
        if (candidateDate > baseDateAtMidnight) {
          dateKeys.push(format(candidateDate, 'yyyy-MM-dd'));
        }
      }
    }

    return dateKeys;
  }

  return [];
};
