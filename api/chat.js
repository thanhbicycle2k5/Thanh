const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
const MAX_OUTPUT_TOKENS = 400;
const SCHEDULY_SYSTEM_INSTRUCTION = `You are Scheduly, a concise English-Vietnamese language assistant. Explain word meaning, pronunciation, part of speech, usage, examples, collocations, and natural translations. Prefer short, clear answers with practical examples. Return the final answer directly without internal reasoning. If context is needed, ask for the full sentence. Keep the answer in the user's language when appropriate.`;
const VOCABULARY_SYSTEM_INSTRUCTION = `You are Scheduly, an English-Vietnamese vocabulary assistant. For vocabulary queries, return only: WORD, IPA, Vietnamese meaning, useful English meaning, CEFR, and 3 short example contexts with Vietnamese translations. Be concise. Do not provide unnecessary explanations.`;
const DICTIONARY_CACHE = new Map();

function isShortVocabularyQuery(query) {
  const trimmedQuery = String(query ?? '').trim();
  const words = trimmedQuery.split(/\s+/).filter(Boolean);
  return trimmedQuery.length > 0
    && trimmedQuery.length <= 80
    && words.length <= 4
    && !/[?!。？！]/.test(trimmedQuery);
}

function isEnglishWordQuery(query) {
  return /^[a-z]+(?:[-'][a-z]+)?$/i.test(query);
}

function formatDictionaryEntry(entry) {
  const phonetic = entry.phonetics?.find((item) => item?.text)?.text ?? 'Not available';
  const meanings = entry.meanings?.slice(0, 2) ?? [];
  const definitionLines = meanings.flatMap((meaning) => {
    const definitions = meaning.definitions?.slice(0, 2) ?? [];
    return definitions.map((definition) => {
      const example = definition.example ? `\n  Example: **${definition.example}**` : '';
      return `- ${definition.definition}${example}`;
    });
  }).join('\n');
  const firstDefinition = meanings[0]?.definitions?.[0]?.definition ?? 'Meaning not available.';

  return `### WORD\n**${entry.word}**\n\n### IPA\n${phonetic}\n\n### PART OF SPEECH\n${meanings[0]?.partOfSpeech ?? 'Not available'}\n\n### MEANING\n- English: ${firstDefinition}\n- Vietnamese: Scheduly chưa có bản dịch tiếng Việt trực tiếp cho mục từ này.\n\n### EXAMPLES\n${definitionLines || '- No example available.'}\n\n_Source: Free Dictionary API_`;
}

async function lookupDictionary(query) {
  if (!isEnglishWordQuery(query)) return null;
  const key = query.toLowerCase();
  const cached = DICTIONARY_CACHE.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.answer;

  try {
    const dictionaryResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`, {
      signal: AbortSignal.timeout(4_000),
    });
    if (!dictionaryResponse.ok) return null;
    const payload = await dictionaryResponse.json();
    const answer = Array.isArray(payload) && payload[0] ? formatDictionaryEntry(payload[0]) : null;
    if (answer) DICTIONARY_CACHE.set(key, { answer, expiresAt: Date.now() + 86_400_000 });
    return answer;
  } catch {
    return null;
  }
}

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

  if (error?.name === 'AbortError' || message.includes('timed out') || message.includes('timeout')) {
    return { status: 503, message: 'Gemini request timed out. Please try again shortly.' };
  }

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

  const vocabularyQuery = isShortVocabularyQuery(question);
  if (vocabularyQuery) {
    const dictionaryAnswer = await lookupDictionary(question);
    if (dictionaryAnswer) return response.status(200).json({ answer: dictionaryAnswer, source: 'dictionary' });
  }

  const apiKey = String(process.env.GEMINI_API_KEY ?? '').trim();
  if (!apiKey) {
    return response.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel Environment Variables.' });
  }

  const history = vocabularyQuery ? [] : normalizeHistory(body.history);
  const contents = [
    ...history.map((turn) => ({
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
          systemInstruction: { parts: [{ text: vocabularyQuery ? VOCABULARY_SYSTEM_INSTRUCTION : SCHEDULY_SYSTEM_INSTRUCTION }] },
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            topP: 0.95,
            candidateCount: 1,
          },
        }),
        signal: AbortSignal.timeout(25_000),
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
      const finishReason = payload?.candidates?.[0]?.finishReason;
      const errorMessage = finishReason === 'MAX_TOKENS'
        ? 'Gemini ran out of response tokens. Please try a shorter question.'
        : 'Gemini returned an empty response.';
      return response.status(502).json({ error: errorMessage });
    }

    return response.status(200).json({ answer });
  } catch (error) {
    const mapped = classifyGeminiError(error);
    return response.status(mapped.status).json({ error: mapped.message });
  }
}
