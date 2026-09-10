import test from 'node:test';
import assert from 'node:assert/strict';

import { catQuotes, catQuoteCategoryCounts, getRandomCatQuote } from './catQuotes';

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
