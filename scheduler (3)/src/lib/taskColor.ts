import { PlanColor } from '../types';

export const getColorForClickCount = (currentColor: PlanColor, clickCount: number): PlanColor => {
  if (clickCount === 1) return 'yellow';
  if (clickCount === 2) return 'green';
  if (clickCount >= 3) return 'default';
  return currentColor;
};
