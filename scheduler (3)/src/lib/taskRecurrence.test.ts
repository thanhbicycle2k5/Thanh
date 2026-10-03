import test from 'node:test';
import assert from 'node:assert/strict';
import { format } from 'date-fns';

import { getAppliedOccurrenceDateKeys, toPlanDateTimestamp } from './taskRecurrence';

test('generated plan timestamps preserve the exact local calendar date', () => {
  const timestamp = toPlanDateTimestamp('2026-10-06');
  assert.equal(format(new Date(timestamp), 'yyyy-MM-dd'), '2026-10-06');
});

test('daily recurrence creates child dates after the original date through the end date', () => {
  assert.deepEqual(getAppliedOccurrenceDateKeys({
    date: new Date(2026, 9, 5).toISOString(),
    applyMode: 'day',
    applyUntil: '2026-10-07',
  }), ['2026-10-06', '2026-10-07']);
});

test('weekly recurrence applies selected weekdays through the requested number of weeks', () => {
  assert.deepEqual(getAppliedOccurrenceDateKeys({
    date: new Date(2026, 9, 5).toISOString(),
    applyMode: 'week',
    applyWeekInterval: 1,
    applyWeekDays: ['mon', 'wed'],
  }), ['2026-10-07', '2026-10-12', '2026-10-14']);
});

test('weekly recurrence skips selected weekdays before the original task date', () => {
  assert.deepEqual(getAppliedOccurrenceDateKeys({
    date: new Date(2026, 9, 3).toISOString(),
    applyMode: 'week',
    applyWeekInterval: 1,
    applyWeekDays: ['mon'],
  }), ['2026-10-05']);
});

test('a Tuesday task applied for five weeks creates children through the fifth week', () => {
  assert.deepEqual(getAppliedOccurrenceDateKeys({
    date: new Date(2026, 9, 6).toISOString(),
    applyMode: 'week',
    applyWeekInterval: 5,
    applyWeekDays: ['tue'],
  }), ['2026-10-13', '2026-10-20', '2026-10-27', '2026-11-03', '2026-11-10']);
});

test('weekly recurrence applies selected weekdays throughout five weeks', () => {
  assert.deepEqual(getAppliedOccurrenceDateKeys({
    date: new Date(2026, 9, 5).toISOString(),
    applyMode: 'week',
    applyWeekInterval: 2,
    applyWeekDays: ['mon'],
  }), ['2026-10-12', '2026-10-19']);
});
