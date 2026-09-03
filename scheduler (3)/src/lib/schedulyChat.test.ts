import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_GEMINI_MODEL,
  buildGeminiRequestPayload,
  classifyGeminiError,
} from './geminiRequest.ts';

test('buildGeminiRequestPayload keeps the payload minimal and valid', () => {
  const payload = buildGeminiRequestPayload('betel');

  assert.equal(payload.model, DEFAULT_GEMINI_MODEL);
  assert.deepEqual(payload.contents, [{
    role: 'user',
    parts: [{ text: 'betel' }],
  }]);
  assert.ok(payload.config);
  assert.equal(payload.config.maxOutputTokens, 400);
});

test('classifyGeminiError distinguishes quota and service failures', () => {
  assert.match(classifyGeminiError({ status: 429 }).message, /Scheduly is busy/i);
  assert.match(classifyGeminiError({ status: 400 }).message, /invalid request/i);
  assert.match(classifyGeminiError({ status: 500 }).message, /temporarily unavailable/i);
});
