import test from 'node:test';
import assert from 'node:assert/strict';

import { getWordClarificationAnswer } from './aiRequest';

test('asks which word to explain instead of sending a vague request to AI', () => {
  assert.equal(getWordClarificationAnswer('Explain a word', 'en'), 'Sure! Which word would you like me to explain?');
  assert.equal(getWordClarificationAnswer('giải thích một từ', 'vi'), 'Bạn muốn mình giải thích từ nào?');
});

test('does not intercept requests that already specify a word', () => {
  assert.equal(getWordClarificationAnswer('Explain extraordinary', 'en'), null);
  assert.equal(getWordClarificationAnswer('What does extraordinary mean?', 'en'), null);
});
