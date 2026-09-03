export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
export const MAX_OUTPUT_TOKENS = 400;

export type ChatTurn = {
  role: 'user' | 'assistant';
  text: string;
};

export const SCHEDULY_SYSTEM_INSTRUCTION = `You are Scheduly, a concise English–Vietnamese language assistant. Explain word meaning, pronunciation, part of speech, usage, examples, collocations, and natural translations. Prefer short, clear answers with practical examples. Return the final answer directly without internal reasoning. If context is needed, ask for the full sentence. Keep the answer in the user's language when appropriate.`;

export const VOCABULARY_SYSTEM_INSTRUCTION = `You are Scheduly, an English-Vietnamese vocabulary assistant. For vocabulary queries, return only: WORD, IPA, Vietnamese meaning, useful English meaning, CEFR, and 3 short example contexts with Vietnamese translations. Be concise. Do not provide unnecessary explanations.`;

export function isShortVocabularyQuery(query: string): boolean {
  const trimmedQuery = String(query ?? '').trim();
  const words = trimmedQuery.split(/\s+/).filter(Boolean);
  return trimmedQuery.length > 0
    && trimmedQuery.length <= 80
    && words.length <= 4
    && !/[?!。？！]/.test(trimmedQuery);
}

export function normalizeHistory(history: ChatTurn[] = []): ChatTurn[] {
  const safeHistory = (Array.isArray(history) ? history : [])
    .map<ChatTurn>((turn) => ({
      role: turn?.role === 'assistant' ? 'assistant' : 'user',
      text: String(turn?.text ?? '').trim(),
    }))
    .filter((turn) => turn.text.length > 0)
    .reduce<ChatTurn[]>((acc, turn) => {
      const previous = acc[acc.length - 1];
      if (previous && previous.role === turn.role && previous.text === turn.text) {
        return acc;
      }
      acc.push(turn);
      return acc;
    }, []);

  return safeHistory.slice(-8);
}

export function buildGeminiRequestPayload(question: string, history: ChatTurn[] = []) {
  const trimmedQuestion = String(question ?? '').trim();
  const vocabularyQuery = isShortVocabularyQuery(trimmedQuestion);
  const safeHistory = vocabularyQuery ? [] : normalizeHistory(history);

  return {
    model: DEFAULT_GEMINI_MODEL,
    contents: [
      ...safeHistory.map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      })),
      {
        role: 'user',
        parts: [{ text: trimmedQuestion }],
      },
    ],
    config: {
      systemInstruction: {
        parts: [{ text: vocabularyQuery ? VOCABULARY_SYSTEM_INSTRUCTION : SCHEDULY_SYSTEM_INSTRUCTION }],
      },
      temperature: 0.35,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      topP: 0.95,
      candidateCount: 1,
    },
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.error === 'string') return record.error;
  }
  return String(error);
}

export function classifyGeminiError(error: unknown): Error {
  const message = getErrorMessage(error).toLowerCase();
  const status = typeof error === 'object' && error !== null
    ? Number((error as Record<string, unknown>).status ?? (error as Record<string, unknown>).statusCode ?? 0)
    : 0;

  if (message.includes('gemini_api_key') || message.includes('server configuration')) {
    return new Error('Scheduly chưa sẵn sàng trên máy chủ. Vui lòng thử lại sau.');
  }

  if (status === 404 && (message.includes('page could not be found') || message.includes('api/chat'))) {
    return new Error('Không tìm thấy API /api/chat trên deployment Vercel. Hãy kiểm tra Root Directory và redeploy.');
  }

  if (status === 429 || message.includes('resource_exhausted') || message.includes('rate limit') || message.includes('quota')) {
    return new Error('Scheduly is busy right now. Please try again in a few minutes.');
  }

  if (status === 401 || status === 403 || message.includes('api key') || message.includes('permission_denied') || message.includes('unauthorized')) {
    return new Error('Scheduly chưa thể xử lý yêu cầu lúc này. Vui lòng thử lại sau.');
  }

  if (status === 404 || message.includes('model not found') || message.includes('not found') || message.includes('404')) {
    return new Error('Scheduly đang được cập nhật. Vui lòng thử lại sau.');
  }

  if (status === 400 || message.includes('invalid_argument') || message.includes('safety') || message.includes('malformed') || message.includes('bad request')) {
    return new Error('Invalid request to Gemini. Please check the prompt and try again.');
  }

  if (status === 502 || message.includes('empty response') || message.includes('max_tokens')) {
    return new Error('Gemini trả về câu trả lời chưa hoàn chỉnh. Vui lòng thử lại.');
  }

  if (status === 500 || status === 503 || message.includes('temporarily unavailable') || message.includes('internal error') || message.includes('service unavailable')) {
    return new Error('Gemini is temporarily unavailable. Please try again in a moment.');
  }

  if (message.includes('failed to fetch') || message.includes('network') || message.includes('fetch failed')) {
    return new Error('Could not reach Gemini. Please check your connection and try again.');
  }

  return new Error('Unable to reach Scheduly right now. Please try again later.');
}

export function formatGeminiUserError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lower = message.toLowerCase();

  if (lower.includes('api limit reached') || lower.includes('resource_exhausted') || lower.includes('rate limit') || lower.includes('quota')) {
    return 'Scheduly đang được nhiều người dùng cùng lúc. Vui lòng thử lại sau ít phút.';
  }

  if (lower.includes('api key') || lower.includes('unauthorized') || lower.includes('permission_denied')) {
    return 'Scheduly chưa sẵn sàng trên máy chủ. Vui lòng thử lại sau.';
  }

  if (lower.includes('model or endpoint') || lower.includes('model not found') || lower.includes('not found') || lower.includes('404')) {
    return 'Scheduly đang được cập nhật. Vui lòng thử lại sau.';
  }

  if (lower.includes('invalid request') || lower.includes('invalid_argument') || lower.includes('bad request') || lower.includes('malformed')) {
    return 'Yêu cầu đến Gemini không hợp lệ. Vui lòng kiểm tra nội dung câu hỏi và thử lại.';
  }

  if (lower.includes('temporarily unavailable') || lower.includes('service unavailable') || lower.includes('internal error') || lower.includes('503')) {
    return 'Gemini đang tạm thời không khả dụng. Vui lòng thử lại sau.';
  }

  if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('fetch failed')) {
    return 'Không thể kết nối đến Gemini. Vui lòng kiểm tra mạng và thử lại sau.';
  }

  return 'Không thể kết nối với Scheduly lúc này. Vui lòng thử lại sau.';
}
