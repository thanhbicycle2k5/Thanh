import { Plan } from '../types';

export const START_MINUTE_OPTIONS = [0, 15, 30, 45] as const;

export const getPlanStartDate = (plan: Pick<Plan, 'date' | 'startHour' | 'startMinute'>) => {
  const start = new Date(plan.date);
  start.setHours(plan.startHour, plan.startMinute ?? 0, 0, 0);
  return start;
};
