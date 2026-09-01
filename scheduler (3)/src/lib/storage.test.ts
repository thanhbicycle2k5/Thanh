import test from 'node:test';
import assert from 'node:assert/strict';

import { defaultSettings, mergeSettingsForSync } from './storage';
import { mergePlans } from './sync';

test('remote settings win when newer than stale local settings', () => {
  const local = { ...defaultSettings, theme: 'light' as const, updatedAt: '2024-01-01T00:00:00.000Z' };
  const remote = { ...defaultSettings, theme: 'dark' as const, updatedAt: '2024-01-02T00:00:00.000Z' };

  const merged = mergeSettingsForSync(local, remote);

  assert.equal(merged.theme, 'dark');
  assert.equal(merged.updatedAt, remote.updatedAt);
});

test('local settings win when they are newer than cloud settings', () => {
  const local = { ...defaultSettings, language: 'vi' as const, updatedAt: '2024-01-03T00:00:00.000Z' };
  const remote = { ...defaultSettings, language: 'en' as const, updatedAt: '2024-01-02T00:00:00.000Z' };

  const merged = mergeSettingsForSync(local, remote);

  assert.equal(merged.language, 'vi');
  assert.equal(merged.updatedAt, local.updatedAt);
});

test('default local settings do not override real user settings without timestamps', () => {
  const local = { ...defaultSettings };
  const remote = {
    ...defaultSettings,
    language: 'vi' as const,
    theme: 'dark' as const,
    notificationsEnabled: true,
    startHour: 8,
    endHour: 20,
    showLunarCalendar: false,
    catColor: 'blue' as const,
  };

  const merged = mergeSettingsForSync(local, remote);

  assert.equal(merged.language, 'vi');
  assert.equal(merged.theme, 'dark');
  assert.equal(merged.notificationsEnabled, true);
  assert.equal(merged.startHour, 8);
});

test('same task id keeps the newest version across desktop and mobile', () => {
  const mobilePlan = {
    id: 'task-36-beach',
    title: 'Đi biển',
    date: '2026-08-31',
    startHour: 6,
    duration: 3,
    color: 'green' as const,
    notes: 'weekend',
    updatedAt: '2026-09-01T08:00:00.000Z',
    createdAt: '2026-08-30T00:00:00.000Z',
  };

  const desktopPlan = {
    id: 'task-36-beach',
    title: 'Đi biển',
    date: '2026-08-31',
    startHour: 6,
    duration: 3,
    color: 'yellow' as const,
    notes: 'stale old value',
    updatedAt: '2026-08-31T09:00:00.000Z',
    createdAt: '2026-08-30T00:00:00.000Z',
  };

  const merged = mergePlans([desktopPlan], [mobilePlan]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, 'task-36-beach');
  assert.equal(merged[0].color, 'green');
  assert.equal(merged[0].notes, 'weekend');
});
