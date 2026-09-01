import test from 'node:test';
import assert from 'node:assert/strict';

import { defaultSettings, mergeSettingsForSync } from './storage';

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
