import test from 'node:test';
import assert from 'node:assert/strict';

import { getColorForClickCount, shouldSkipGeneratedDate } from './taskColor';

test('second completion click always turns a previously colored task green', () => {
  assert.equal(getColorForClickCount('blue', 2), 'green');
  assert.equal(getColorForClickCount('red', 2), 'green');
  assert.equal(getColorForClickCount('yellow', 2), 'green');
});

test('third click resets task to default color', () => {
  assert.equal(getColorForClickCount('green', 3), 'default');
});

test('weekly repeated tasks do not create a duplicate entry on the original date', () => {
  assert.equal(shouldSkipGeneratedDate('2026-09-08T00:00:00.000Z', '2026-09-08T12:00:00.000Z'), true);
  assert.equal(shouldSkipGeneratedDate('2026-09-08T00:00:00.000Z', '2026-09-15T00:00:00.000Z'), false);
});
