const assert = require('node:assert/strict');
const { execSync } = require('node:child_process');
const { configureVapid } = require('./_push');

const saved = { ...process.env };

function reset() {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('NEXT_PUBLIC_VAPID') || key.startsWith('VAPID_')) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, saved);
}

function generateKeys() {
  const output = execSync('npx web-push generate-vapid-keys', {
    cwd: __dirname + '/..',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).toString();

  const publicKey = output.match(/Public Key:\s*(.+)/)?.[1]?.trim();
  const privateKey = output.match(/Private Key:\s*(.+)/)?.[1]?.trim();

  if (!publicKey || !privateKey) {
    throw new Error('Failed to generate valid VAPID keys.');
  }

  return { publicKey, privateKey };
}

try {
  reset();
  const legacyKeys = generateKeys();
  process.env.VAPID_PUBLIC_KEY = legacyKeys.publicKey;
  process.env.VAPID_PRIVATE_KEY = legacyKeys.privateKey;
  process.env.VAPID_SUBJECT = 'mailto:test@example.com';
  assert.equal(configureVapid(), legacyKeys.publicKey);

  reset();
  const modernKeys = generateKeys();
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = modernKeys.publicKey;
  process.env.VAPID_PRIVATE_KEY = modernKeys.privateKey;
  process.env.VAPID_SUBJECT = 'mailto:test@example.com';
  assert.equal(configureVapid(), modernKeys.publicKey);

  console.log('push config tests passed');
} catch (error) {
  console.error('push config tests failed');
  console.error(error);
  process.exit(1);
} finally {
  reset();
}
