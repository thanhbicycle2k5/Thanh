import { isSameWeek } from 'date-fns';

import { Plan } from '../types';

export interface WeeklyLeaderboardEntry {
  uid: string;
  name: string;
  weekStarting: string;
  completed: number;
  total: number;
  score: number;
}

export interface RankedLeaderboardEntry extends WeeklyLeaderboardEntry {
  rank: number;
  completionRate: number;
}

export const getWeeklyLeaderboardScore = (
  plans: Plan[],
  weekStarting: string
): Pick<WeeklyLeaderboardEntry, 'weekStarting' | 'completed' | 'total' | 'score'> => {
  const weekStart = new Date(`${weekStarting}T12:00:00`);
  const weeklyPlans = plans.filter((plan) => {
    const planDate = new Date(plan.date);
    return !Number.isNaN(planDate.getTime())
      && isSameWeek(planDate, weekStart, { weekStartsOn: 1 });
  });

  const completed = weeklyPlans.filter((plan) => plan.color === 'green').length;
  const total = weeklyPlans.length;
  return {
    weekStarting,
    completed,
    total,
    score: total > 0 ? Math.round((completed / total) * 10_000) : 0,
  };
};

export const rankLeaderboardEntries = (
  entries: WeeklyLeaderboardEntry[]
): RankedLeaderboardEntry[] => [...entries]
  .filter((entry) => Number.isInteger(entry.completed)
    && Number.isInteger(entry.total)
    && Number.isInteger(entry.score)
    && entry.total > 0
    && entry.completed >= 0
    && entry.completed <= entry.total
    && entry.score >= 0
    && entry.score <= 10_000)
  .sort((a, b) => {
    return b.score - a.score || b.completed - a.completed || a.name.localeCompare(b.name);
  })
  .map((entry, index) => ({
    ...entry,
    rank: index + 1,
    completionRate: Math.round((entry.score / 100)),
  }));
