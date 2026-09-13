const { admin, requireDevice, normalizeSubscription } = require('../_push');

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });
  try {
    const subscription = normalizeSubscription(request.body?.subscription);
    if (!subscription) return response.status(400).json({ error: 'Invalid push subscription.' });
    const device = await requireDevice(request, true);
    if (!device) return response.status(400).json({ error: 'Invalid device credentials.' });
    const id = Buffer.from(subscription.endpoint).toString('base64url').slice(0, 140);
    await device.ref.collection('subscriptions').doc(id).set({ ...subscription, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return response.status(200).json({ ok: true });
  } catch (error) { console.error('Push subscription error:', error); return response.status(500).json({ error: 'Could not save the push subscription.' }); }
};