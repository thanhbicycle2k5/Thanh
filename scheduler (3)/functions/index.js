const { createHash } = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { defineSecret } = require('firebase-functions/params');
const { HttpsError, onCall } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const webPush = require('web-push');

initializeApp();

const db = getFirestore();
const vapidPublicKey = defineSecret('VAPID_PUBLIC_KEY');
const vapidPrivateKey = defineSecret('VAPID_PRIVATE_KEY');
const vapidSubject = defineSecret('VAPID_SUBJECT');
const REGION = 'us-central1';
const MAX_REMINDERS = 250;
const MAX_DUE_PER_RUN = 100;
const MAX_LATE_MS = 60_000;
const SEND_LEASE_MS = 90_000;

function requireUser(request) {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in to enable background notifications.');
  }
  return request.auth.uid;
}

function stableId(value) {
  return createHash('sha256').update(value).digest('hex');
}

function localDateKey(timestamp, offsetMinutes) {
  return new Date(timestamp - offsetMinutes * 60_000).toISOString().slice(0, 10);
}

function validateSubscription(subscription) {
  if (!subscription || typeof subscription !== 'object'
    || typeof subscription.endpoint !== 'string'
    || typeof subscription.keys?.p256dh !== 'string'
    || typeof subscription.keys?.auth !== 'string') {
    throw new HttpsError('invalid-argument', 'Invalid push subscription.');
  }

  let endpoint;
  try {
    endpoint = new URL(subscription.endpoint);
  } catch {
    throw new HttpsError('invalid-argument', 'Invalid push endpoint.');
  }
  if (endpoint.protocol !== 'https:') {
    throw new HttpsError('invalid-argument', 'Push endpoint must use HTTPS.');
  }
}

exports.getPushConfig = onCall(
  { region: REGION, secrets: [vapidPublicKey] },
  async (request) => {
    requireUser(request);
    return { publicKey: vapidPublicKey.value() };
  }
);

exports.savePushSubscription = onCall(
  { region: REGION },
  async (request) => {
    const uid = requireUser(request);
    const subscription = request.data?.subscription;
    validateSubscription(subscription);
    const id = stableId(subscription.endpoint);
    await db.doc(`users/${uid}/pushSubscriptions/${id}`).set({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      updatedAt: Date.now(),
    });
  }
);

exports.syncPushReminders = onCall(
  { region: REGION },
  async (request) => {
    const uid = requireUser(request);
    const reminders = request.data?.reminders;
    if (!Array.isArray(reminders) || reminders.length > MAX_REMINDERS) {
      throw new HttpsError('invalid-argument', `Provide no more than ${MAX_REMINDERS} reminders.`);
    }

    const parsed = reminders.map((reminder) => {
      if (!reminder || typeof reminder.id !== 'string' || reminder.id.length > 256
        || typeof reminder.taskId !== 'string' || reminder.taskId.length > 128
        || typeof reminder.title !== 'string' || reminder.title.length > 120
        || typeof reminder.body !== 'string' || reminder.body.length > 500
        || !Number.isFinite(reminder.fireAt)
        || !Number.isFinite(reminder.expiresAt)
        || !/^\d{4}-\d{2}-\d{2}$/.test(reminder.taskDate)
        || !Number.isInteger(reminder.timeZoneOffsetMinutes)
        || Math.abs(reminder.timeZoneOffsetMinutes) > 840) {
        throw new HttpsError('invalid-argument', 'A reminder contains invalid fields.');
      }
      return reminder;
    });
    if (new Set(parsed.map(({ id }) => id)).size !== parsed.length) {
      throw new HttpsError('invalid-argument', 'Reminder IDs must be unique.');
    }

    const existingSnapshot = await db.collection('pushReminders').where('uid', '==', uid).get();
    const existingById = new Map(existingSnapshot.docs.map((snapshot) => [snapshot.get('reminderId'), snapshot]));
    const incomingIds = new Set(parsed.map(({ id }) => id));
    const operations = [];

    for (const reminder of parsed) {
      const documentId = stableId(`${uid}:${reminder.id}`);
      const existing = existingById.get(reminder.id);
      const sameScheduledTime = existing?.get('fireAt') === reminder.fireAt;
      operations.push({
        type: 'set',
        ref: db.doc(`pushReminders/${documentId}`),
        data: {
          ...reminder,
          uid,
          reminderId: reminder.id,
          status: sameScheduledTime ? existing.get('status') : 'pending',
          attempts: sameScheduledTime ? existing.get('attempts') || 0 : 0,
          updatedAt: Date.now(),
        },
      });
    }

    for (const snapshot of existingSnapshot.docs) {
      if (!incomingIds.has(snapshot.get('reminderId'))) {
        operations.push({ type: 'delete', ref: snapshot.ref });
      }
    }

    for (let index = 0; index < operations.length; index += 400) {
      const batch = db.batch();
      for (const operation of operations.slice(index, index + 400)) {
        if (operation.type === 'delete') batch.delete(operation.ref);
        else batch.set(operation.ref, operation.data);
      }
      await batch.commit();
    }
  }
);

exports.removePushSubscription = onCall(
  { region: REGION },
  async (request) => {
    const uid = requireUser(request);
    const endpoint = request.data?.endpoint;
    if (typeof endpoint !== 'string') {
      throw new HttpsError('invalid-argument', 'A push endpoint is required.');
    }
    const subscriptionRef = db.doc(`users/${uid}/pushSubscriptions/${stableId(endpoint)}`);
    await subscriptionRef.delete();
    const remaining = await db.collection(`users/${uid}/pushSubscriptions`).limit(1).get();
    if (!remaining.empty) return;

    const reminders = await db.collection('pushReminders').where('uid', '==', uid).get();
    for (let index = 0; index < reminders.docs.length; index += 400) {
      const batch = db.batch();
      reminders.docs.slice(index, index + 400).forEach((document) => batch.delete(document.ref));
      await batch.commit();
    }
  }
);

exports.sendPushTest = onCall(
  { region: REGION, secrets: [vapidPublicKey, vapidPrivateKey, vapidSubject] },
  async (request) => {
    const uid = requireUser(request);
    webPush.setVapidDetails(vapidSubject.value(), vapidPublicKey.value(), vapidPrivateKey.value());
    const subscriptions = await db.collection(`users/${uid}/pushSubscriptions`).get();
    if (subscriptions.empty) {
      throw new HttpsError('failed-precondition', 'No push-enabled device is registered.');
    }
    const message = JSON.stringify({
      title: '🐱 Scheduly nhắc nhở nè!',
      body: 'Đây là thông báo thử từ Task2Goal.',
      tag: 'task2goal-push-test',
    });
    await Promise.all(subscriptions.docs.map((document) =>
      webPush.sendNotification(document.data(), message, { TTL: '60', urgency: 'high' })
    ));
  }
);

exports.dispatchDuePushReminders = onSchedule(
  {
    schedule: 'every 1 minutes',
    timeZone: 'UTC',
    region: REGION,
    secrets: [vapidPublicKey, vapidPrivateKey, vapidSubject],
    maxInstances: 1,
  },
  async () => {
    webPush.setVapidDetails(vapidSubject.value(), vapidPublicKey.value(), vapidPrivateKey.value());
    const now = Date.now();
    const due = await db.collection('pushReminders')
      .where('status', 'in', ['pending', 'sending'])
      .where('fireAt', '<=', now)
      .orderBy('fireAt')
      .limit(MAX_DUE_PER_RUN)
      .get();

    for (const candidate of due.docs) {
      const ref = candidate.ref;
      const claim = await db.runTransaction(async (transaction) => {
        const latest = await transaction.get(ref);
        if (!latest.exists) return null;
        const data = latest.data();
        if (data.status === 'sent' || data.status === 'expired' || data.status === 'failed') return null;
        if (data.status === 'sending' && data.leaseUntil > now) return null;
        transaction.update(ref, {
          status: 'sending',
          attempts: (data.attempts || 0) + 1,
          leaseUntil: now + SEND_LEASE_MS,
        });
        return { ...data, attempts: (data.attempts || 0) + 1 };
      });
      if (!claim) continue;

      const expired = now - claim.fireAt > MAX_LATE_MS
        || claim.expiresAt <= now
        || localDateKey(now, claim.timeZoneOffsetMinutes) !== claim.taskDate;
      if (expired) {
        await ref.update({ status: 'expired', leaseUntil: 0 });
        continue;
      }

      const subscriptions = await db.collection(`users/${claim.uid}/pushSubscriptions`).get();
      if (subscriptions.empty) {
        await ref.update({ status: 'failed', leaseUntil: 0 });
        continue;
      }

      const payload = JSON.stringify({
        title: claim.title,
        body: claim.body,
        tag: claim.reminderId,
        data: { taskId: claim.taskId },
      });
      let failed = false;
      await Promise.all(subscriptions.docs.map(async (subscriptionDocument) => {
        try {
          await webPush.sendNotification(subscriptionDocument.data(), payload, { TTL: '60', urgency: 'high' });
        } catch (error) {
          if (error.statusCode === 404 || error.statusCode === 410) {
            await subscriptionDocument.ref.delete();
          } else {
            failed = true;
            console.error('Web Push delivery failed:', error);
          }
        }
      }));

      if (failed && claim.attempts < 3) {
        await ref.update({ status: 'pending', leaseUntil: 0 });
      } else {
        await ref.update({ status: failed ? 'failed' : 'sent', sentAt: Date.now(), leaseUntil: 0 });
      }
    }
  }
);
