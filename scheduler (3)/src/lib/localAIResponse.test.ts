import test from 'node:test';
import assert from 'node:assert/strict';

import { createThinkTagFilter, parseFinalAnswer, stripThinkTags } from './localAIResponse';

test('removes thinking tags and their content', () => {
  assert.equal(stripThinkTags('Hello. <think>private reasoning</think> How can I help?'), 'Hello.  How can I help?');
});

test('removes thinking tags split across streamed chunks', () => {
  const filter = createThinkTagFilter();
  const visible = [
    filter.push('Hello. <thi'),
    filter.push('nk>private'),
    filter.push(' reasoning</th'),
    filter.push('ink> Answer.'),
    filter.finish(),
  ].join('');

  assert.equal(visible, 'Hello.  Answer.');
});

test('does not reveal an unfinished thinking block', () => {
  assert.equal(stripThinkTags('Visible answer <think>private reasoning'), 'Visible answer');
});

test('reads only the structured final answer and rejects unstructured reasoning', () => {
  assert.equal(parseFinalAnswer('{"answer":"Thank you! How can I help?"}'), 'Thank you! How can I help?');
  assert.equal(parseFinalAnswer('Let me think through this carefully...'), '');
  assert.equal(parseFinalAnswer('{"thinking":"long reasoning"}'), '');
});
