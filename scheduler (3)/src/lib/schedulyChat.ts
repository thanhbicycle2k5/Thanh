import { classifyGeminiError, isShortVocabularyQuery, normalizeHistory, type ChatTurn } from './geminiRequest';

const GEMINI_REQUEST_CACHE_TTL_MS = 30_000;
const GEMINI_REQUEST_CACHE = new Map<string, { timestamp: number; answer: string }>();
const GEMINI_REQUEST_IN_FLIGHT = new Set<string>();

export async function streamScheduly(
  question: string,
  onUpdate: (answer: string) => void,
  history: ChatTurn[] = [],
): Promise<void> {
  const trimmedQuestion = String(question ?? '').trim();
  const shortVocabularyQuery = isShortVocabularyQuery(trimmedQuestion);
  const recentHistory = shortVocabularyQuery ? [] : normalizeHistory(history).slice(-6);

  if (!trimmedQuestion) {
    throw new Error('Vui lòng nhập câu hỏi trước khi gửi.');
  }

  const cacheKey = JSON.stringify({
    question: trimmedQuestion,
    history: recentHistory,
  });

  const cachedResponse = GEMINI_REQUEST_CACHE.get(cacheKey);
  if (cachedResponse && Date.now() - cachedResponse.timestamp < GEMINI_REQUEST_CACHE_TTL_MS) {
    onUpdate(cachedResponse.answer);
    return;
  }

  if (GEMINI_REQUEST_IN_FLIGHT.has(cacheKey)) {
    return;
  }

  GEMINI_REQUEST_IN_FLIGHT.add(cacheKey);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: trimmedQuestion,
        history: recentHistory,
      }),
    });

    let payload: { answer?: string; error?: string; message?: string } | null = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const errorMessage = payload?.error || payload?.message || 'Không thể kết nối với Scheduly lúc này. Vui lòng thử lại sau.';
      const requestError = new Error(errorMessage) as Error & { status?: number };
      requestError.status = response.status;
      throw requestError;
    }

    const answer = typeof payload?.answer === 'string' ? payload.answer.trim() : '';
    if (!answer) {
      throw new Error('Scheduly chưa tạo được câu trả lời. Vui lòng thử lại.');
    }

    GEMINI_REQUEST_CACHE.set(cacheKey, { timestamp: Date.now(), answer });
    onUpdate(answer);
  } catch (error) {
    throw classifyGeminiError(error);
  } finally {
    GEMINI_REQUEST_IN_FLIGHT.delete(cacheKey);
  }
}

export { classifyGeminiError, DEFAULT_GEMINI_MODEL, MAX_OUTPUT_TOKENS, normalizeHistory, formatGeminiUserError, isShortVocabularyQuery } from './geminiRequest';