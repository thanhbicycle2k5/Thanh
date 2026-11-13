const assert = require('node:assert/strict');
const test = require('node:test');
const { decryptVaultKey, encryptVaultKey, hashCode } = require('./_shared');

test('recovery key is encrypted at rest and can be unwrapped with the configured server key', () => {
  const previousKey = process.env.SECRET_CALENDAR_RECOVERY_KEY;
  const vaultKey = require('node:crypto').randomBytes(32);
  process.env.SECRET_CALENDAR_RECOVERY_KEY = require('node:crypto').randomBytes(32).toString('base64');
  try {
    const wrapped = encryptVaultKey(vaultKey);
    assert.notEqual(wrapped, vaultKey.toString('base64'));
    assert.deepEqual(Buffer.from(decryptVaultKey(wrapped), 'base64'), vaultKey);
  } finally {
    if (previousKey === undefined) delete process.env.SECRET_CALENDAR_RECOVERY_KEY;
    else process.env.SECRET_CALENDAR_RECOVERY_KEY = previousKey;
  }
});

test('recovery code hashes are bound to the account and salt', () => {
  const previousKey = process.env.SECRET_CALENDAR_RECOVERY_KEY;
  process.env.SECRET_CALENDAR_RECOVERY_KEY = require('node:crypto').randomBytes(32).toString('base64');
  try {
    const hash = hashCode('user-1', 'salt-1', '123456');
    assert.deepEqual(hash, hashCode('user-1', 'salt-1', '123456'));
    assert.notDeepEqual(hash, hashCode('user-2', 'salt-1', '123456'));
    assert.notDeepEqual(hash, hashCode('user-1', 'salt-2', '123456'));
  } finally {
    if (previousKey === undefined) delete process.env.SECRET_CALENDAR_RECOVERY_KEY;
    else process.env.SECRET_CALENDAR_RECOVERY_KEY = previousKey;
  }
});
