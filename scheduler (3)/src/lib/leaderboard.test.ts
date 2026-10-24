import test from 'node:test';
import assert from 'node:assert/strict';

import { Plan } from '../types';
import {
  getLeaderboardPeriodStarting,
  getLeaderboardScore,
  rankLeaderboardEntries,
} from './leaderboard';

const makePlan = (id: string, date: string, color: Plan['color']): Plan => ({
  id,
  title: id,
  date,
  startHour: 9,
  duration: 1,
  color,
});

test('period starting uses Monday weeks and calendar month and year', () => {
  const date = new Date(2026, 9, 23, 12);

  assert.equal(getLeaderboardPeriodStarting(date, 'week'), '2026-10-19');
  assert.equal(getLeaderboardPeriodStarting(date, 'month'), '2026-10-01');
  assert.equal(getLeaderboardPeriodStarting(date, 'year'), '2026-01-01');
});

test('weekly score counts only plans within the requested week', () => {
  assert.deepEqual(getLeaderboardScore([
    makePlan('done', '2026-10-19', 'green'),
    makePlan('pending', '2026-10-20', 'yellow'),
    makePlan('previous-week', '2026-10-18', 'green'),
    makePlan('invalid-date', 'invalid', 'green'),
  ], 'week', '2026-10-19'), {
    periodStarting: '2026-10-19',
    completed: 1,
    total: 2,
    score: 5000,
  });
});

test('monthly and yearly scores include only plans from their calendar period', () => {
  const plans = [
    makePlan('october-done', '2026-10-05', 'green'),
    makePlan('october-open', '2026-10-24', 'yellow'),
    makePlan('previous-month', '2026-09-30', 'green'),
    makePlan('previous-year', '2025-12-31', 'green'),
  ];

  assert.deepEqual(getLeaderboardScore(plans, 'month', '2026-10-01'), {
    periodStarting: '2026-10-01',
    completed: 1,
    total: 2,
    score: 5000,
  });
  assert.deepEqual(getLeaderboardScore(plans, 'year', '2026-01-01'), {
    periodStarting: '2026-01-01',
    completed: 2,
    total: 3,
    score: 6667,
  });
});

test('leaderboard ranks by completion rate and filters invalid scores', () => {
  const ranked = rankLeaderboardEntries([
    { uid: 'two-of-four', name: 'B', periodStarting: '2026-10-19', completed: 2, total: 4, score: 5000 },
    { uid: 'one-of-one', name: 'C', periodStarting: '2026-10-19', completed: 1, total: 1, score: 10000 },
    { uid: 'three-of-four', name: 'A', periodStarting: '2026-10-19', completed: 3, total: 4, score: 7500 },
    { uid: 'invalid', name: 'D', periodStarting: '2026-10-19', completed: 3, total: 2, score: 15000 },
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
