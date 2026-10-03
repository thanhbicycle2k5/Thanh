import test from 'node:test';
import assert from 'node:assert/strict';

import { getAppliedOccurrenceDateKeys } from './taskRecurrence';

test('daily recurrence creates child dates after the original date through the end date', () => {
  assert.deepEqual(getAppliedOccurrenceDateKeys({
    date: new Date(2026, 9, 5).toISOString(),
    applyMode: 'day',
    applyUntil: '2026-10-07',
  }), ['2026-10-06', '2026-10-07']);
});

test('weekly recurrence creates selected weekdays in the next interval week', () => {
  assert.deepEqual(getAppliedOccurrenceDateKeys({
    date: new Date(2026, 9, 5).toISOString(),
    applyMode: 'week',
    applyWeekInterval: 1,
    applyWeekDays: ['mon', 'wed'],
  }), ['2026-10-12', '2026-10-14']);
});

test('weekly recurrence honors intervals greater than one week', () => {
  assert.deepEqual(getAppliedOccurrenceDateKeys({
    date: new Date(2026, 9, 5).toISOString(),
    applyMode: 'week',
    applyWeekInterval: 2,
    applyWeekDays: ['mon'],
  }), ['2026-10-19']);
});
