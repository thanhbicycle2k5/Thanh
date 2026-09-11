const FREE_MODEL = 'openrouter/free';
const MAX_REQUESTS_PER_DAY = 20;
const MAX_HISTORY_TURNS = 8;
const MAX_MESSAGE_LENGTH = 4_000;
const MAX_CONTEXT_ITEMS = 12;
const requestCounts = new Map();

function getDayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getRateLimitKey(request) {
  const forwardedFor = String(request.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
  return forwardedFor || String(request.headers['x-real-ip'] ?? '').trim() || 'unknown-client';
}

function getRateLimit(request) {
  const key = `${getRateLimitKey(request)}:${getDayKey()}`;
  const current = requestCounts.get(key) ?? 0;
  if (current >= MAX_REQUESTS_PER_DAY) return false;
  requestCounts.set(key, current + 1);
  return true;
}

function cleanText(value, maxLength = MAX_MESSAGE_LENGTH) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({
      role: turn?.role === 'assistant' ? 'assistant' : 'user',
      content: cleanText(turn?.text),
    }))
    .filter((turn) => turn.content.length > 0);
}

function normalizeTaskContext(context) {
  if (!Array.isArray(context)) return [];
  return context.slice(0, MAX_CONTEXT_ITEMS).map((task) => ({
    title: cleanText(task?.title, 160),
    date: cleanText(task?.date, 40),
    startHour: Number.isFinite(Number(task?.startHour)) ? Number(task.startHour) : null,
    startMinute: Number.isFinite(Number(task?.startMinute)) ? Number(task.startMinute) : 0,
    duration: Number.isFinite(Number(task?.duration)) ? Number(task.duration) : null,
    completed: task?.completed === true,
  })).filter((task) => task.title && task.date);
}

function getFriendlyError(status) {
  if (status === 401 || status === 403) return 'AI is temporarily unavailable. Please try again later.';
  if (status === 429) return 'AI is temporarily unavailable because the free AI limit has been reached. Please try again later.';
  if (status === 402) return 'AI is temporarily unavailable because no free model is available right now. Please try again later.';
  return 'AI is temporarily unavailable. Please try again later.';
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = String(process.env.OPENROUTER_API_KEY ?? '').trim();
  if (!apiKey) {
    return response.status(503).json({ error: 'AI is temporarily unavailable. Please try again later.' });
  }

  const body = request.body ?? {};
  const question = String(body.question ?? '').trim();
  if (!question) return response.status(400).json({ error: 'Please enter a message.' });
  if (!getRateLimit(request)) {
    return response.status(429).json({ error: 'Today\'s free AI limit has been reached. Please try again tomorrow.' });
  }

  const history = normalizeHistory(body.history);
  const taskContext = normalizeTaskContext(body.taskContext);
  const contextMessage = taskContext.length > 0
    ? `Relevant Scheduly tasks (use only when helpful):\n${taskContext.map((task) => `- ${task.title} | ${task.date} | ${task.startHour === null ? 'time unknown' : `${String(task.startHour).padStart(2, '0')}:${String(task.startMinute).padStart(2, '0')}`} | ${task.duration ?? '?'} min | ${task.completed ? 'completed' : 'unfinished'}`).join('\n')}`
    : '';

  const messages = [
    {
      role: 'system',
      content: 'You are Scheduly AI, a concise and practical personal assistant. Help with planning, study, English, writing, and everyday questions. Use the supplied task context only when relevant. Never claim to have changed tasks or settings. If asked to change data, explain that the user must do it in Scheduly. Answer in the user\'s language when clear. Use Markdown when useful.',
    },
    ...(contextMessage ? [{ role: 'system', content: contextMessage }] : []),
    ...history,
    { role: 'user', content: question },
  ];

  try {
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://scheduly.vercel.app',
        'X-Title': 'Scheduly AI',
      },
      body: JSON.stringify({
        model: FREE_MODEL,
        messages,
        temperature: 0.35,
        max_tokens: 500,
        stream: false,
      }),
      signal: AbortSignal.timeout(25_000),
    });

    const payload = await openRouterResponse.json().catch(() => null);
    if (!openRouterResponse.ok) {
      return response.status(502).json({ error: getFriendlyError(openRouterResponse.status) });
    }

    const resolvedModel = String(payload?.model ?? '');
    if (resolvedModel && resolvedModel !== FREE_MODEL && !resolvedModel.endsWith(':free')) {
      return response.status(503).json({ error: 'AI is temporarily unavailable because no free model is available right now. Please try again later.' });
    }

    const answer = cleanText(payload?.choices?.[0]?.message?.content, 8_000);
    if (!answer) return response.status(502).json({ error: 'AI is temporarily unavailable. Please try again later.' });
    return response.status(200).json({ answer, model: FREE_MODEL });
  } catch {
    return response.status(503).json({ error: 'AI is temporarily unavailable. Please try again later.' });
  }
}
