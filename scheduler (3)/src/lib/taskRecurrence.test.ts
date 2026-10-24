import test from 'node:test';
import assert from 'node:assert/strict';
import { format } from 'date-fns';

import { createAppliedOccurrencePlan, getAppliedOccurrenceDateKeys, toPlanDateTimestamp } from './taskRecurrence';
import { Plan } from '../types';

test('generated plan timestamps preserve the exact local calendar date', () => {
  const timestamp = toPlanDateTimestamp('2026-10-06');
  assert.equal(format(new Date(timestamp), 'yyyy-MM-dd'), '2026-10-06');
});

test('applied child plans do not inherit notes or recurrence settings from the source', () => {
  const source: Plan = {
    id: 'source',
    title: 'Task',
    date: '2026-10-05T12:00:00.000Z',
    startHour: 9,
    duration: 1,
    color: 'yellow',
    notes: 'Source-only note',
    applyMode: 'day',
    applyUntil: '2026-10-10',
  };

  const child = createAppliedOccurrencePlan(source, '2026-10-06', 'child');

  assert.equal(child.id, 'child');
  assert.equal(format(new Date(child.date), 'yyyy-MM-dd'), '2026-10-06');
  assert.equal(child.notes, undefined);
  assert.equal(child.applyMode, 'none');
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
  }), ['2026-10-12', '2026-10-14']);
});

test('zero weekly duration does not create child tasks', () => {
  assert.deepEqual(getAppliedOccurrenceDateKeys({
    date: new Date(2026, 9, 3).toISOString(),
    applyMode: 'week',
    applyWeekInterval: 0,
    applyWeekDays: ['mon'],
  }), []);
});

test('weekly recurrence skips the original week', () => {
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
