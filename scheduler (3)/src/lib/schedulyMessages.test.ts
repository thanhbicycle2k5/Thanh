import test from 'node:test';
import assert from 'node:assert/strict';

import { getRandomPomodoroEncouragementMessage, getSchedulyMessage } from './schedulyMessages';

test('completion praise uses the display name and task name', () => {
  const message = getSchedulyMessage('complete', 'Study English', 'Mina');

  assert.match(message, /^Mina ơi,/);
  assert.match(message, /Study English/);
});

test('completion praise uses bạn when no display name is set', () => {
  assert.match(getSchedulyMessage('complete'), /^bạn ơi,/);
});

test('Pomodoro praise uses the display name or falls back to bạn', () => {
  assert.match(getRandomPomodoroEncouragementMessage('Mina'), /^Mina ơi,/);
  assert.match(getRandomPomodoroEncouragementMessage('  '), /^bạn ơi,/);
});
