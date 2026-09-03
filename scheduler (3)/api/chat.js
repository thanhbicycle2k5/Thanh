const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
const MAX_OUTPUT_TOKENS = 512;
const SCHEDULY_SYSTEM_INSTRUCTION = `You are Scheduly, a concise English-Vietnamese language assistant. Explain word meaning, pronunciation, part of speech, usage, examples, collocations, and natural translations. Prefer short, clear answers with practical examples. If context is needed, ask for the full sentence. Keep the answer in the user's language when appropriate.`;

function normalizeHistory(history) {
  const safeHistory = Array.isArray(history) ? history : [];
  const cleaned = safeHistory
    .map((turn) => ({
      role: turn && turn.role === 'assistant' ? 'model' : 'user',
      text: String(turn?.text ?? '').trim(),
    }))
    .filter((turn) => turn.text.length > 0)
    .reduce((result, turn) => {
      const previous = result[result.length - 1];
      if (previous && previous.role === turn.role && previous.text === turn.text) {
        return result;
      }
      result.push(turn);
      return result;
    }, []);

  return cleaned.slice(-8);
}

function classifyGeminiError(error) {
  const message = String(error?.message ?? error).toLowerCase();
  const status = Number(error?.status ?? error?.statusCode ?? 0);

  if (status === 429 || message.includes('resource_exhausted') || message.includes('rate limit') || message.includes('quota')) {
    return { status: 429, message: 'Gemini API limit reached. Please try again later.' };
  }
  if (status === 401 || status === 403 || message.includes('api key') || message.includes('permission_denied') || message.includes('unauthorized')) {
    return { status: 401, message: 'Gemini API key is invalid or unauthorized. Check Vercel Environment Variables.' };
  }
  if (status === 404 || message.includes('model not found') || message.includes('not found')) {
    return { status: 404, message: 'Gemini model or endpoint is not available.' };
  }
  if (status === 400 || message.includes('invalid_argument') || message.includes('malformed') || message.includes('bad request')) {
    return { status: 400, message: 'Invalid request sent to Gemini.' };
  }
  if (status === 500 || status === 503 || message.includes('temporarily unavailable') || message.includes('service unavailable')) {
    return { status: 503, message: 'Gemini is temporarily unavailable. Please try again shortly.' };
  }
  return { status: 500, message: 'Scheduly could not reach Gemini right now.' };
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Only POST requests are supported.' });
  }

  const body = request.body ?? {};
  const question = String(body.question ?? '').trim();
  if (!question) {
    return response.status(400).json({ error: 'Please enter a question before sending.' });
  }

  const apiKey = String(process.env.GEMINI_API_KEY ?? '').trim();
  if (!apiKey) {
    return response.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel Environment Variables.' });
  }

  const contents = [
    ...normalizeHistory(body.history).map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
    { role: 'user', parts: [{ text: question }] },
  ];

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: SCHEDULY_SYSTEM_INSTRUCTION }] },
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            topP: 0.95,
            candidateCount: 1,
          },
        }),
      },
    );

    const payload = await geminiResponse.json().catch(() => null);
    if (!geminiResponse.ok) {
      const error = new Error(payload?.error?.message ?? 'Gemini request failed.');
      error.status = geminiResponse.status;
      throw error;
    }

    const answer = payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text ?? '')
      .join('')
      .trim();

    if (!answer) {
      return response.status(502).json({ error: 'Gemini returned an empty response.' });
    }

    return response.status(200).json({ answer });
  } catch (error) {
    const mapped = classifyGeminiError(error);
    return response.status(mapped.status).json({ error: mapped.message });
  }
}
