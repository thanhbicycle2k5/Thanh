import test from 'node:test';
import assert from 'node:assert/strict';

import { getColorForClickCount } from './taskColor';

test('second completion click always turns a previously colored task green', () => {
  assert.equal(getColorForClickCount('blue', 2), 'green');
  assert.equal(getColorForClickCount('red', 2), 'green');
  assert.equal(getColorForClickCount('yellow', 2), 'green');
});

test('third click resets task to default color', () => {
  assert.equal(getColorForClickCount('green', 3), 'default');
});
