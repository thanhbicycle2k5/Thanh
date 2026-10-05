import test from 'node:test';
import assert from 'node:assert/strict';

import { getColorForClickCount, shouldSkipGeneratedDate } from './taskColor';

test('a single click does not change a task color automatically', () => {
  assert.equal(getColorForClickCount('blue', 1), 'blue');
  assert.equal(getColorForClickCount('red', 1), 'red');
  assert.equal(getColorForClickCount('default', 1), 'default');
});

test('a single click does not undo a completed task', () => {
  assert.equal(getColorForClickCount('green', 1), 'green');
});

test('a double-click completes a task by turning it green', () => {
  assert.equal(getColorForClickCount('blue', 2), 'green');
  assert.equal(getColorForClickCount('red', 2), 'green');
  assert.equal(getColorForClickCount('yellow', 2), 'green');
});

test('expired gray tasks stay locked and do not change color when clicked again', () => {
  assert.equal(getColorForClickCount('gray', 1), 'gray');
  assert.equal(getColorForClickCount('gray', 2), 'gray');
  assert.equal(getColorForClickCount('gray', 3), 'gray');
});

test('third click resets task to default color', () => {
  assert.equal(getColorForClickCount('green', 3), 'default');
});

test('weekly repeated tasks do not create a duplicate entry on the original date', () => {
  assert.equal(shouldSkipGeneratedDate('2026-09-08T00:00:00.000Z', '2026-09-08T12:00:00.000Z'), true);
  assert.equal(shouldSkipGeneratedDate('2026-09-08T00:00:00.000Z', '2026-09-15T00:00:00.000Z'), false);
});
