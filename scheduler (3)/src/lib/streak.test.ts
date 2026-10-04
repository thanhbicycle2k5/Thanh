import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateStreak, getCompletedDayKeys, getLocalDateKey } from './streak';
import { Plan } from '../types';

const makePlan = (id: string, date: string, color: Plan['color'] = 'green'): Plan => ({
  id,
  title: id,
  date,
  startHour: 9,
  duration: 1,
  color,
});

test('completed plans count once per local calendar date', () => {
  assert.deepEqual(getCompletedDayKeys([
    makePlan('first', '2026-10-02'),
    makePlan('second', '2026-10-02'),
    makePlan('not-done', '2026-10-03', 'yellow'),
  ]), ['2026-10-02']);
});

test('current streak includes today or falls back to yesterday', () => {
  const today = new Date(2026, 9, 4, 12);

  assert.equal(calculateStreak(['2026-10-02', '2026-10-03'], today).current, 2);
  assert.equal(calculateStreak(['2026-10-03'], today).current, 1);
  assert.equal(calculateStreak(['2026-10-02'], today).current, 0);
});

test('best streak keeps historical record when current streak resets', () => {
  const stats = calculateStreak(['2026-09-01', '2026-09-02', '2026-09-03'], new Date(2026, 9, 4), 5);

  assert.equal(stats.current, 0);
  assert.equal(stats.best, 5);
});

test('local date keys use local calendar fields', () => {
  assert.equal(getLocalDateKey(new Date(2026, 9, 4, 0, 30)), '2026-10-04');
});
