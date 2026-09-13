const { admin, getDb, webpush, configureVapid } = require('../_push');

function isAuthorized(request) {
  const expected = String(process.env.CRON_SECRET || '').trim();
  return !expected || request.headers.authorization === `Bearer ${expected}`;
}

module.exports = async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed.' });
  if (!isAuthorized(request)) return response.status(401).json({ error: 'Unauthorized.' });
  try {
    configureVapid();
    const db = getDb();
    const now = Date.now();
    const snapshot = await db.collectionGroup('reminders').where('fireAt', '<=', now).get();
    let sent = 0;
    for (const reminderSnapshot of snapshot.docs) {
      const reminder = reminderSnapshot.data();
      if (reminder.sentAt && (!reminder.claimedAt || now - reminder.claimedAt < 5 * 60_000)) continue;
      const claim = await db.runTransaction(async (transaction) => {
        const currentSnapshot = await transaction.get(reminderSnapshot.ref);
        const current = currentSnapshot.data();
        if (!current || (current.sentAt && (!current.claimedAt || now - current.claimedAt < 5 * 60_000))) return null;
        transaction.update(reminderSnapshot.ref, { claimedAt: now });
        return current;
      });
      if (!claim) continue;
      const deviceSnapshot = await reminderSnapshot.ref.parent.parent.get();
      if (!deviceSnapshot.exists) continue;
      const subscriptions = await deviceSnapshot.ref.collection('subscriptions').get();
      const payload = JSON.stringify({ title: claim.title, body: claim.body, tag: claim.id, data: { taskId: claim.taskId, reminderId: claim.id } });
      let delivered = false;
      for (const subscriptionSnapshot of subscriptions.docs) {
        try { await webpush.sendNotification(subscriptionSnapshot.data(), payload); delivered = true; }
        catch (error) { if (error.statusCode === 404 || error.statusCode === 410) await subscriptionSnapshot.ref.delete(); }
      }
      if (delivered) { await reminderSnapshot.ref.update({ sentAt: admin.firestore.FieldValue.serverTimestamp(), claimedAt: now }); sent += 1; }
      else await reminderSnapshot.ref.update({ claimedAt: null });
    }
    return response.status(200).json({ ok: true, due: snapshot.size, sent });
  } catch (error) {
    const details = {
      name: error?.name || 'Error',
      code: error?.code || 'unknown',
      message: String(error?.message || error),
    };
    console.error('Reminder cron error:', details);
    return response.status(500).json({ error: 'Reminder processing failed.', code: details.code });
  }
};