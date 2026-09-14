const crypto = require('node:crypto');
const { cert, getApp, getApps, initializeApp } = require('firebase-admin/app');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const webpush = require('web-push');

const admin = { firestore: { FieldValue } };

function getFirebaseApp() {
  if (getApps().length > 0) return getApp();
  const serviceAccountJson = String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
  if (serviceAccountJson) {
    return initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
  }
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: String(process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

function getDb() {
  return getFirestore(getFirebaseApp());
}

function configureVapid() {
  const publicKey = String(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '').trim();
  const privateKey = String(process.env.VAPID_PRIVATE_KEY || '').trim();
  const subject = String(process.env.VAPID_SUBJECT || '').trim();
  if (!publicKey || !privateKey || !subject) throw new Error('Web Push VAPID environment variables are not configured.');
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return publicKey;
}

function cleanText(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function normalizeDeviceId(value) {
  const deviceId = cleanText(value, 96);
  return /^[a-zA-Z0-9_-]+$/.test(deviceId) ? deviceId : '';
}

function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getDeviceCredentials(request) {
  const deviceId = normalizeDeviceId(request.body?.deviceId || request.headers['x-device-id']);
  const token = cleanText(request.body?.deviceToken || request.headers['x-device-token'], 256);
  if (!deviceId || token.length < 32) return null;
  return { deviceId, token, hash: tokenHash(token) };
}

async function requireDevice(request, create = false) {
  const credentials = getDeviceCredentials(request);
  if (!credentials) return null;
  const ref = getDb().collection('task2goalDevices').doc(credentials.deviceId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    if (!create) return null;
    await ref.set({ tokenHash: credentials.hash, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return { ...credentials, ref };
  }
  if (snapshot.data().tokenHash !== credentials.hash) return null;
  await ref.set({ updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  return { ...credentials, ref };
}

function normalizeSubscription(subscription) {
  const endpoint = cleanText(subscription?.endpoint, 2048);
  const p256dh = cleanText(subscription?.keys?.p256dh, 512);
  const auth = cleanText(subscription?.keys?.auth, 512);
  if (!endpoint || !p256dh || !auth || !/^https:\/\//.test(endpoint)) return null;
  return { endpoint, keys: { p256dh, auth } };
}

function normalizeReminder(reminder) {
  const id = cleanText(reminder?.id, 160);
  const title = cleanText(reminder?.title, 200);
  const body = cleanText(reminder?.body, 1000);
  const fireAt = Number(reminder?.fireAt);
  if (!id || !title || !body || !Number.isFinite(fireAt) || fireAt < 0) return null;
  return { id, title, body, fireAt, taskId: cleanText(reminder?.taskId, 160) };
}

module.exports = { admin, getDb, webpush, configureVapid, requireDevice, normalizeSubscription, normalizeReminder };