import test from 'node:test';
import assert from 'node:assert/strict';

import { Plan } from '../types';
import { getWeeklyLeaderboardScore, rankLeaderboardEntries } from './leaderboard';

const makePlan = (id: string, date: string, color: Plan['color']): Plan => ({
  id,
  title: id,
  date,
  startHour: 9,
  duration: 1,
  color,
});

test('weekly score counts only plans within the requested week', () => {
  assert.deepEqual(getWeeklyLeaderboardScore([
    makePlan('done', '2026-10-19', 'green'),
    makePlan('pending', '2026-10-20', 'yellow'),
    makePlan('previous-week', '2026-10-18', 'green'),
    makePlan('invalid-date', 'invalid', 'green'),
  ], '2026-10-19'), {
    weekStarting: '2026-10-19',
    completed: 1,
    total: 2,
    score: 5000,
  });
});

test('leaderboard ranks by completion rate and filters invalid scores', () => {
  const ranked = rankLeaderboardEntries([
    { uid: 'two-of-four', name: 'B', weekStarting: '2026-10-19', completed: 2, total: 4, score: 5000 },
    { uid: 'one-of-one', name: 'C', weekStarting: '2026-10-19', completed: 1, total: 1, score: 10000 },
    { uid: 'three-of-four', name: 'A', weekStarting: '2026-10-19', completed: 3, total: 4, score: 7500 },
    { uid: 'invalid', name: 'D', weekStarting: '2026-10-19', completed: 3, total: 2, score: 15000 },
  ]);

  assert.deepEqual(ranked.map(({ uid, rank, completionRate }) => ({
    uid,
    rank,
    completionRate,
  })), [
    { uid: 'one-of-one', rank: 1, completionRate: 100 },
    { uid: 'three-of-four', rank: 2, completionRate: 75 },
    { uid: 'two-of-four', rank: 3, completionRate: 50 },
  ]);
});
