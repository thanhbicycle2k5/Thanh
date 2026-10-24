import { format, isSameWeek, startOfMonth, startOfWeek, startOfYear } from 'date-fns';

import { Plan } from '../types';

export type LeaderboardPeriod = 'week' | 'month' | 'year';
export const LEADERBOARD_PERIODS: LeaderboardPeriod[] = ['week', 'month', 'year'];

export interface LeaderboardEntry {
  uid: string;
  name: string;
  periodStarting: string;
  completed: number;
  total: number;
  score: number;
}

export interface RankedLeaderboardEntry extends LeaderboardEntry {
  rank: number;
  completionRate: number;
}

export const getLeaderboardPeriodStarting = (date: Date, period: LeaderboardPeriod): string => {
  const periodStart = period === 'week'
    ? startOfWeek(date, { weekStartsOn: 1 })
    : period === 'month'
      ? startOfMonth(date)
      : startOfYear(date);
  return format(periodStart, 'yyyy-MM-dd');
};

export const getLeaderboardScore = (
  plans: Plan[],
  period: LeaderboardPeriod,
  periodStarting: string
): Pick<LeaderboardEntry, 'periodStarting' | 'completed' | 'total' | 'score'> => {
  const periodStart = new Date(`${periodStarting}T12:00:00`);
  const periodPlans = plans.filter((plan) => {
    const planDate = new Date(plan.date);
    if (Number.isNaN(planDate.getTime())) return false;

    if (period === 'week') {
      return isSameWeek(planDate, periodStart, { weekStartsOn: 1 });
    }
    if (period === 'month') {
      return planDate.getFullYear() === periodStart.getFullYear()
        && planDate.getMonth() === periodStart.getMonth();
    }
    return planDate.getFullYear() === periodStart.getFullYear();
  });

  const completed = periodPlans.filter((plan) => plan.color === 'green').length;
  const total = periodPlans.length;
  return {
    periodStarting,
    completed,
    total,
    score: total > 0 ? Math.round((completed / total) * 10_000) : 0,
  };
};

export const rankLeaderboardEntries = (
  entries: LeaderboardEntry[]
): RankedLeaderboardEntry[] => [...entries]
  .filter((entry) => Number.isInteger(entry.completed)
    && Number.isInteger(entry.total)
    && Number.isInteger(entry.score)
    && entry.total >= 0
    && entry.completed >= 0
    && entry.completed <= entry.total
    && entry.score >= 0
    && entry.score <= 10_000)
  .sort((a, b) => b.score - a.score || b.completed - a.completed || a.name.localeCompare(b.name))
  .map((entry, index) => ({
    ...entry,
    rank: index + 1,
    completionRate: Math.round(entry.score / 100),
  }));
