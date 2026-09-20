import test from 'node:test';
import assert from 'node:assert/strict';

import { calculatePomodoroRemainingSeconds, shouldStartPomodoroMusic } from './pomodoro';

test('pomodoro remaining time is based on a real deadline, not a decrementing tick', () => {
  const now = 1_700_000_000_000;
  const deadlineMs = now + 25 * 60 * 1000;

  assert.equal(calculatePomodoroRemainingSeconds(deadlineMs, now), 1500);
  assert.equal(calculatePomodoroRemainingSeconds(deadlineMs, now + 10_000), 1490);
  assert.equal(calculatePomodoroRemainingSeconds(deadlineMs, now + 24_000), 1476);
  assert.equal(calculatePomodoroRemainingSeconds(deadlineMs, now + 25 * 60 * 1000), 0);
});

test('pomodoro music should only auto-start once per active session', () => {
  assert.equal(
    shouldStartPomodoroMusic({
      pomodoroRunning: true,
      pomodoroSoundEnabled: true,
      isMusicPlaying: false,
      targetTrackId: 'track-1',
      lastStartedTrackId: 'track-1',
    }),
    false,
  );

  assert.equal(
    shouldStartPomodoroMusic({
      pomodoroRunning: true,
      pomodoroSoundEnabled: true,
      isMusicPlaying: false,
      targetTrackId: 'track-2',
      lastStartedTrackId: 'track-1',
    }),
    true,
  );

  assert.equal(
    shouldStartPomodoroMusic({
      pomodoroRunning: false,
      pomodoroSoundEnabled: true,
      isMusicPlaying: false,
      targetTrackId: 'track-1',
      lastStartedTrackId: 'track-1',
    }),
    false,
  );
});
