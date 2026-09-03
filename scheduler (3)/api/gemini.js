import { GoogleGenAI } from '@google/genai';

const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
const MAX_OUTPUT_TOKENS = 512;
const SCHEDULY_SYSTEM_INSTRUCTION = `You are Scheduly, a concise English–Vietnamese language assistant. Explain word meaning, pronunciation, part of speech, usage, examples, collocations, and natural translations. Prefer short, clear answers with practical examples. If context is needed, ask for the full sentence. Keep the answer in the user's language when appropriate.`;

function normalizeHistory(history = []) {
  const safeHistory = Array.isArray(history) ? history : [];
  const cleaned = safeHistory
    .map((turn) => ({
      role: turn && turn.role === 'assistant' ? 'assistant' : 'user',
      text: String(turn?.text ?? '').trim(),
    }))
    .filter((turn) => turn.text.length > 0)
    .reduce((acc, turn) => {
      const previous = acc[acc.length - 1];
      if (previous && previous.role === turn.role && previous.text === turn.text) {
        return acc;
      }
      acc.push(turn);
      return acc;
    }, []);

  return cleaned.slice(-8);
}

function classifyGeminiError(error) {
  const message = (error && error.message ? error.message : String(error)).toLowerCase();
  const status = Number(error?.status ?? error?.statusCode ?? 0);

  if (status === 429 || message.includes('resource_exhausted') || message.includes('rate limit') || message.includes('quota')) {
    return { status: 429, message: 'API limit reached. Please try again later.' };
  }

  if (status === 401 || status === 403 || message.includes('api key') || message.includes('permission_denied') || message.includes('unauthorized')) {
    return { status: 401, message: 'Gemini API key is invalid or unauthorized. Please check the server configuration.' };
  }

  if (status === 404 || message.includes('model not found') || message.includes('not found')) {
    return { status: 404, message: 'Gemini model or endpoint is not available. Please check the selected model.' };
  }

  if (status === 400 || message.includes('invalid_argument') || message.includes('safety') || message.includes('malformed') || message.includes('bad request')) {
    return { status: 400, message: 'Invalid request to Gemini. Please check the prompt and try again.' };
  }

  if (status === 500 || status === 503 || message.includes('temporarily unavailable') || message.includes('internal error') || message.includes('service unavailable')) {
    return { status: 503, message: 'Gemini is temporarily unavailable. Please try again in a moment.' };
  }

  if (message.includes('failed to fetch') || message.includes('network') || message.includes('fetch failed')) {
    return { status: 503, message: 'Could not reach Gemini. Please check your connection and try again.' };
  }

  return { status: 500, message: 'Unable to reach Scheduly right now. Please try again later.' };
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Only POST requests are supported.' });
  }

  const body = request.body ?? {};
  const question = String(body.question ?? '').trim();
  const history = normalizeHistory(body.history ?? []);

  if (!question) {
    return response.status(400).json({ error: 'Please enter a question before sending.' });
  }

  const apiKey = String(process.env.GEMINI_API_KEY ?? '').trim();
  if (!apiKey) {
    return response.status(500).json({ error: 'Gemini API key is not configured on the server.' });
  }

  const payload = {
    model: DEFAULT_GEMINI_MODEL,
    contents: [
      ...history.map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      })),
      { role: 'user', parts: [{ text: question }] },
    ],
    config: {
      systemInstruction: {
        parts: [{ text: SCHEDULY_SYSTEM_INSTRUCTION }],
      },
      temperature: 0.35,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      topP: 0.95,
      candidateCount: 1,
    },
  };

  const requestSize = Buffer.byteLength(JSON.stringify(payload), 'utf8');

  if (process.env.NODE_ENV !== 'production') {
    console.info('[Scheduly Gemini]', {
      status: 200,
      model: DEFAULT_GEMINI_MODEL,
      historyTurns: history.length,
      requestSize,
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent(payload);
    const answer = typeof result?.text === 'string' ? result.text.trim() : '';

    if (!answer) {
      return response.status(502).json({ error: 'Gemini returned an empty response.' });
    }

    return response.status(200).json({ answer });
  } catch (error) {
    const mapped = classifyGeminiError(error);
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Scheduly Gemini error]', {
        status: mapped.status,
        model: DEFAULT_GEMINI_MODEL,
        requestSize,
        errorCode: error?.code ?? null,
        message: error?.message ?? String(error),
      });
    }
    return response.status(mapped.status).json({ error: mapped.message });
  }
}
