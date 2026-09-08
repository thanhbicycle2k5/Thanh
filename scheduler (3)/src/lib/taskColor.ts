import { format } from 'date-fns';
import { PlanColor } from '../types';

export const getColorForClickCount = (currentColor: PlanColor, clickCount: number): PlanColor => {
  if (clickCount === 1) return 'yellow';
  if (clickCount === 2) return 'green';
  if (clickCount >= 3) return 'default';
  return currentColor;
};

export const shouldSkipGeneratedDate = (baseDate: string | Date, candidateDate: string | Date): boolean => {
  const normalize = (value: string | Date) => format(new Date(value), 'yyyy-MM-dd');
  return normalize(baseDate) === normalize(candidateDate);
};
