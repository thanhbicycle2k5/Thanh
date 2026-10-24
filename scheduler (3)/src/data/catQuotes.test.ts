import test from 'node:test';
import assert from 'node:assert/strict';

import { allCatQuotes, catQuotes, catQuoteCategoryCounts, getRandomCatQuote } from './catQuotes';
import { folkSayings } from './folkSayings';
import { pomodoroEncouragementMessages } from '../lib/schedulyMessages';

test('mascot quote data contains 100 valid bilingual local quotes', () => {
  assert.equal(catQuotes.length, 100);
  assert.deepEqual(catQuotes.map((quote) => quote.id), Array.from({ length: 100 }, (_, index) => index + 1));
  assert.equal(new Set(catQuotes.map((quote) => quote.text)).size, 100);
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

test('every mascot quote pairs one Vietnamese line with its English translation', () => {
  const vietnameseDiacritics = /[ăâđêôơưàáạảãấầẩẫậắằẳẵặèéẹẻẽếềểễệìíịỉĩòóọỏõốồổỗộớờởỡợùúụủũứừửữựỳýỵỷỹ]/iu;
  assert.ok(allCatQuotes.every((quote) => {
    const [vietnamese, english, ...extraLines] = quote.text.split('\n');
    return Boolean(vietnamese?.trim())
      && Boolean(english?.trim())
      && extraLines.length === 0
      && /[.!?]$/.test(vietnamese)
      && /[.!?]$/.test(english)
      && vietnameseDiacritics.test(vietnamese)
      && !vietnameseDiacritics.test(english)
      && vietnamese !== english;
  }));
});

test('folk sayings use complete standalone proverbs and paired verse lines', () => {
  assert.ok(folkSayings.length > 50);
  assert.deepEqual(folkSayings.map((saying) => saying.id), Array.from({ length: folkSayings.length }, (_, index) => index + 1));
  assert.equal(new Set(folkSayings.map((saying) => saying.text)).size, folkSayings.length);
  assert.ok(folkSayings.every((saying) => saying.text.trim().length > 0));
  assert.ok(folkSayings.every((saying) => saying.englishText.trim().length > 0));
  assert.ok(folkSayings.every((saying) => /[.!?]$/.test(saying.text)));
  assert.deepEqual(new Set(folkSayings.map((saying) => saying.kind)), new Set(['ca-dao', 'tuc-ngu']));
  assert.equal(allCatQuotes.length, catQuotes.length + folkSayings.length);
  assert.match(
    folkSayings.find((saying) => saying.text.startsWith('Cá không ăn muối'))?.englishText ?? '',
    /^A fish that will not take salt/,
  );
  assert.match(
    folkSayings.find((saying) => saying.text.startsWith('Trăng bao nhiêu tuổi'))?.englishText ?? '',
    /^How old is the moon/,
  );
});

test('pomodoro encouragement pool contains 500 unique cheerful lines', () => {
  assert.equal(pomodoroEncouragementMessages.length, 500);
  assert.equal(new Set(pomodoroEncouragementMessages).size, 500);
  assert.ok(pomodoroEncouragementMessages.every((line) => line.trim().length > 0));
});
