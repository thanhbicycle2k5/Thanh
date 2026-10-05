import test from 'node:test';
import assert from 'node:assert/strict';

import { getPlanReminderDate, getPlanStartDate, getPlanEndDate, getPlanEndMinutes, START_MINUTE_OPTIONS, isPlanPastEndGracePeriod, isReminderStillRelevant, isWithinReminderWindow } from './taskTime';

test('supports start minutes in 15-minute increments', () => {
  const date = getPlanStartDate({
    date: '2026-09-01',
    startHour: 9,
    startMinute: 15,
  });

  test('interprets date-only task dates in the local timezone', () => {
    const start = getPlanStartDate({
      date: '2026-10-04',
      startHour: 9,
    });

    assert.equal(start.getFullYear(), 2026);
    assert.equal(start.getMonth(), 9);
    assert.equal(start.getDate(), 4);
    assert.equal(start.getHours(), 9);
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

test('grays a task only after one hour has passed since its scheduled end', () => {
  const plan = {
    date: '2026-09-01',
    startHour: 9,
    startMinute: 15,
    duration: 1,
  };
  const taskEnd = getPlanEndDate(plan);

  assert.equal(taskEnd.getHours(), 10);
  assert.equal(taskEnd.getMinutes(), 0);
  assert.equal(isPlanPastEndGracePeriod(plan, new Date(taskEnd.getTime() + 59 * 60 * 1000)), false);
  assert.equal(isPlanPastEndGracePeriod(plan, new Date(taskEnd.getTime() + 60 * 60 * 1000)), true);
});

test('treats only the 14–15 minute reminder window as due, not any outside offset', () => {
  assert.equal(isWithinReminderWindow(15), true);
  assert.equal(isWithinReminderWindow(14.5), true);
  assert.equal(isWithinReminderWindow(14), true);
  assert.equal(isWithinReminderWindow(13.9), false);
  assert.equal(isWithinReminderWindow(15.1), false);
  assert.equal(isWithinReminderWindow(16), false);
});

test('only catches up a missed reminder while its task starts within 15 minutes', () => {
  assert.equal(isReminderStillRelevant(15), true);
  assert.equal(isReminderStillRelevant(5), true);
  assert.equal(isReminderStillRelevant(0), false);
  assert.equal(isReminderStillRelevant(-1), false);
  assert.equal(isReminderStillRelevant(15.1), false);
});
