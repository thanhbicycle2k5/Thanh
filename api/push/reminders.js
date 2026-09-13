const { admin, getDb, requireDevice, normalizeReminder } = require('../_push');

module.exports = async function handler(request, response) {
  if (request.method !== 'PUT') return response.status(405).json({ error: 'Method not allowed.' });
  try {
    const device = await requireDevice(request, false);
    if (!device) return response.status(401).json({ error: 'Invalid device credentials.' });
    const input = Array.isArray(request.body?.reminders) ? request.body.reminders : [];
    if (input.length > 500) return response.status(400).json({ error: 'Too many reminders.' });
    const reminders = input.map(normalizeReminder).filter(Boolean);
    const collection = device.ref.collection('reminders');
    const existing = await collection.get();
    const nextIds = new Set(reminders.map((reminder) => reminder.id));
    const batch = getDb().batch();
    existing.docs.forEach((snapshot) => { if (!nextIds.has(snapshot.id)) batch.delete(snapshot.ref); });
    reminders.forEach((reminder) => {
      const existingSnapshot = existing.docs.find((snapshot) => snapshot.id === reminder.id);
      const existingReminder = existingSnapshot?.data();
      const unchanged = existingReminder
        && existingReminder.fireAt === reminder.fireAt
        && existingReminder.title === reminder.title
        && existingReminder.body === reminder.body;
      batch.set(collection.doc(reminder.id), {
        ...reminder,
        deviceId: device.deviceId,
        ...(unchanged && existingReminder.sentAt ? { sentAt: existingReminder.sentAt } : { sentAt: null }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    });
    await batch.commit();
    return response.status(200).json({ ok: true, count: reminders.length });
  } catch (error) { console.error('Reminder sync error:', error); return response.status(500).json({ error: 'Could not save reminders.' }); }
};