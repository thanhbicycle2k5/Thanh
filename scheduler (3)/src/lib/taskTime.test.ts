import test from 'node:test';
import assert from 'node:assert/strict';

import { getPlanReminderDate, getPlanStartDate, getPlanEndMinutes, START_MINUTE_OPTIONS } from './taskTime';

test('supports start minutes in 15-minute increments', () => {
  const date = getPlanStartDate({
    date: '2026-09-01',
    startHour: 9,
    startMinute: 15,
  });

  const reminder = getPlanReminderDate({
    date: '2026-09-01',
    startHour: 9,
    startMinute: 15,
  });

  assert.deepEqual(START_MINUTE_OPTIONS, [0, 15, 30, 45]);
  assert.equal(date.getHours(), 9);
  assert.equal(date.getMinutes(), 15);
  assert.equal(reminder.getHours(), 9);
  assert.equal(reminder.getMinutes(), 0);
});

test('keeps the end time on a whole hour when start minute is not zero', () => {
  const endOfFirstTask = getPlanEndMinutes({
    startHour: 7,
    startMinute: 15,
    duration: 1,
  });

  const startOfNextTask = (8 * 60) + 0;

  assert.equal(endOfFirstTask, 8 * 60);
  assert.equal(startOfNextTask, endOfFirstTask);
  assert.ok(startOfNextTask >= endOfFirstTask);
});
