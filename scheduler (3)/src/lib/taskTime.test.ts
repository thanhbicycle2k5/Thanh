import test from 'node:test';
import assert from 'node:assert/strict';

import { getPlanStartDate, START_MINUTE_OPTIONS } from './taskTime';

test('supports start minutes in 15-minute increments', () => {
  const date = getPlanStartDate({
    date: '2026-09-01',
    startHour: 9,
    startMinute: 15,
  });

  assert.deepEqual(START_MINUTE_OPTIONS, [0, 15, 30, 45]);
  assert.equal(date.getHours(), 9);
  assert.equal(date.getMinutes(), 15);
});
