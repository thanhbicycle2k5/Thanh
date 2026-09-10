import test from 'node:test';
import assert from 'node:assert/strict';

import { allCatQuotes, catQuotes, catQuoteCategoryCounts, getRandomCatQuote } from './catQuotes';
import { folkSayings } from './folkSayings';

test('mascot quote data contains exactly 500 valid local quotes', () => {
  assert.equal(catQuotes.length, 500);
  assert.deepEqual(catQuotes.map((quote) => quote.id), Array.from({ length: 500 }, (_, index) => index + 1));
  assert.equal(new Set(catQuotes.map((quote) => quote.text)).size, 500);
  assert.ok(catQuotes.every((quote) => quote.text.trim().length > 0));

  for (const [category, expectedCount] of Object.entries(catQuoteCategoryCounts)) {
    assert.equal(catQuotes.filter((quote) => quote.category === category).length, expectedCount);
  }
});

test('random mascot quote does not repeat the previous quote', () => {
  const previousQuote = catQuotes[0];
  const nextQuote = getRandomCatQuote(previousQuote.id);
  assert.notEqual(nextQuote.id, previousQuote.id);
});

test('folk sayings add exactly 500 local entries to the mascot pool', () => {
  assert.equal(folkSayings.length, 500);
  assert.deepEqual(folkSayings.map((saying) => saying.id), Array.from({ length: 500 }, (_, index) => index + 1));
  assert.equal(new Set(folkSayings.map((saying) => saying.text)).size, 500);
  assert.ok(folkSayings.every((saying) => saying.text.trim().length > 0));
  assert.deepEqual(new Set(folkSayings.map((saying) => saying.kind)), new Set(['ca-dao', 'tuc-ngu']));
  assert.equal(allCatQuotes.length, 1000);
});
