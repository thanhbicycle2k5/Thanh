import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSecretCalendarVault,
  encryptSecretCalendarPlans,
  rewrapSecretCalendarKey,
  unlockSecretCalendarVault,
} from './secretCalendarCrypto';

test('secret calendar starts empty and its content cannot be opened without the password', async () => {
  const { vault, vaultKey } = await createSecretCalendarVault('correct horse battery');
  assert.deepEqual((await unlockSecretCalendarVault(vault, 'correct horse battery')).plans, []);
  await assert.rejects(() => unlockSecretCalendarVault(vault, 'wrong password'));

  const privatePlan = {
    id: 'secret-plan',
    title: 'Private appointment',
    date: '2026-11-13',
    startHour: 10,
    duration: 1,
    color: 'yellow' as const,
  };
  const withPlan = await encryptSecretCalendarPlans(vault, vaultKey, [privatePlan]);
  assert.equal(withPlan.encryptedData.includes(privatePlan.title), false);
  assert.deepEqual((await unlockSecretCalendarVault(withPlan, 'correct horse battery')).plans, [privatePlan]);
});

test('a recovered vault key can rewrap the calendar for a new password without losing plans', async () => {
  const { vault, vaultKey } = await createSecretCalendarVault('old password');
  const privatePlan = {
    id: 'secret-plan',
    title: 'Keep this',
    date: '2026-11-13',
    startHour: 11,
    duration: 1,
    color: 'blue' as const,
  };
  const withPlan = await encryptSecretCalendarPlans(vault, vaultKey, [privatePlan]);
  const resetVault = await rewrapSecretCalendarKey(withPlan, vaultKey, 'new password');

  await assert.rejects(() => unlockSecretCalendarVault(resetVault, 'old password'));
  assert.deepEqual((await unlockSecretCalendarVault(resetVault, 'new password')).plans, [privatePlan]);
});
