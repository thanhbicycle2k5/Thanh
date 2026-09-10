import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FREE_AI_MODEL,
  normalizeHistory,
} from './aiRequest.ts';
import { findInDictionary, lookupLocalDictionary } from './localDictionary.ts';

test('local dictionary finds normalized vocabulary before any remote fallback', () => {
  assert.equal(findInDictionary(' DEMOCRACY ')?.word, 'democracy');
  assert.equal(findInDictionary('democracy nghĩa là gì?')?.word, 'democracy');
  assert.match(lookupLocalDictionary('democracy?') ?? '', /Source: Local Dictionary/);
  assert.match(lookupLocalDictionary('betel') ?? '', /Source: Local Dictionary/);
  assert.equal(findInDictionary('xyzabcunknownword'), null);
});

test('AI configuration stays on the OpenRouter free router', () => {
  assert.equal(FREE_AI_MODEL, 'openrouter/free');
  assert.deepEqual(normalizeHistory([
    { role: 'user', text: 'Hello' },
    { role: 'assistant', text: 'Hi' },
  ]), [
    { role: 'user', text: 'Hello' },
    { role: 'assistant', text: 'Hi' },
  ]);
});