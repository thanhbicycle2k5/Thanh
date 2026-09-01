import { Plan } from '../types';

export const START_MINUTE_OPTIONS = [0, 15, 30, 45] as const;

export const formatPlanTime = (hour: number, minute: number = 0) => {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

export const getPlanStartDate = (plan: Pick<Plan, 'date' | 'startHour' | 'startMinute'>) => {
  const start = new Date(plan.date);
  start.setHours(plan.startHour, plan.startMinute ?? 0, 0, 0);
  return start;
};
