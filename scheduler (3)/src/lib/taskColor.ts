import { format } from 'date-fns';
import { PlanColor } from '../types';

export const getColorForClickCount = (currentColor: PlanColor, clickCount: number): PlanColor => {
  if (currentColor === 'gray' || currentColor === 'green') return currentColor;
  if (clickCount === 2) return 'green';
  return currentColor;
};

export const shouldSkipGeneratedDate = (baseDate: string | Date, candidateDate: string | Date): boolean => {
  const normalize = (value: string | Date) => format(new Date(value), 'yyyy-MM-dd');
  return normalize(baseDate) === normalize(candidateDate);
};
