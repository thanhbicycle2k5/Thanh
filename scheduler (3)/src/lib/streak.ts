import { Plan } from '../types';

export interface StreakStats {
  current: number;
  best: number;
  completedToday: boolean;
  completedDayKeys: string[];
}

export const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isValidDateKey = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.getUTCFullYear() === Number(year)
    && date.getUTCMonth() === Number(month) - 1
    && date.getUTCDate() === Number(day);
};

export const getPlanLocalDateKey = (dateValue: string): string | null => {
  const dateOnly = /^(\d{4}-\d{2}-\d{2})$/.exec(dateValue)?.[1];
  if (dateOnly && isValidDateKey(dateOnly)) return dateOnly;

  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? null : getLocalDateKey(date);
};

export const isPlanOnLocalDate = (dateValue: string, date: Date): boolean => {
  const planDateKey = getPlanLocalDateKey(dateValue);
  return planDateKey !== null && planDateKey === getLocalDateKey(date);
};

const shiftDateKey = (dateKey: string, days: number): string => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
};

export const getCompletedDayKeys = (plans: Plan[]): string[] => {
  return [...new Set(
    plans
      .filter((plan) => plan.color === 'green')
      .map((plan) => getPlanLocalDateKey(plan.date))
      .filter((dateKey): dateKey is string => dateKey !== null)
  )].sort();
};

export const calculateStreak = (
  completedDayKeys: string[],
  today: Date,
  historicalDayKeys: string[] = []
): StreakStats => {
  const currentDayKeys = [...new Set(completedDayKeys.filter(isValidDateKey))].sort();
  const validDayKeys = [...new Set([...currentDayKeys, ...historicalDayKeys.filter(isValidDateKey)])].sort();
  const completedDays = new Set(validDayKeys);
  const todayKey = getLocalDateKey(today);
  const completedToday = currentDayKeys.includes(todayKey);

  let current = 0;
  let currentDay = completedToday ? todayKey : shiftDateKey(todayKey, -1);
  while (completedDays.has(currentDay)) {
    current += 1;
    currentDay = shiftDateKey(currentDay, -1);
  }

  let bestFromHistory = 0;
  let runLength = 0;
  let previousDay: string | null = null;
  for (const dayKey of validDayKeys) {
    runLength = previousDay && shiftDateKey(previousDay, 1) === dayKey
      ? runLength + 1
      : 1;
    bestFromHistory = Math.max(bestFromHistory, runLength);
    previousDay = dayKey;
  }

  return {
    current,
    best: Math.max(current, bestFromHistory),
    completedToday,
    completedDayKeys: validDayKeys,
  };
};
