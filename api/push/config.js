const { configureVapid } = require('../_push');

module.exports = async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed.' });
  try { return response.status(200).json({ publicKey: configureVapid() }); }
  catch (error) { console.error('Push config error:', error); return response.status(503).json({ error: 'Push notifications are not configured.' }); }
};