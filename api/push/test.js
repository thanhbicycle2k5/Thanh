const { webpush, configureVapid, requireDevice } = require('../_push');

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });
  try {
    const device = await requireDevice(request, false);
    if (!device) return response.status(401).json({ error: 'Invalid device credentials.' });
    configureVapid();
    const subscriptions = await device.ref.collection('subscriptions').get();
    const payload = JSON.stringify({ title: 'Task2Goal', body: 'Test notification', tag: 'task2goal-test' });
    const results = await Promise.all(subscriptions.docs.map(async (snapshot) => {
      try { await webpush.sendNotification(snapshot.data(), payload); return true; }
      catch (error) { if (error.statusCode === 404 || error.statusCode === 410) await snapshot.ref.delete(); return false; }
    }));
    if (!results.some(Boolean)) return response.status(404).json({ error: 'No valid push subscription found.' });
    return response.status(200).json({ ok: true });
  } catch (error) { console.error('Test push error:', error); return response.status(500).json({ error: 'Could not send the test notification.' }); }
};