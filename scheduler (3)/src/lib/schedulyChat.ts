import { classifyGeminiError, isShortVocabularyQuery, normalizeHistory, type ChatTurn } from './geminiRequest';
import { lookupLocalDictionary } from './localDictionary';
import { lookupOpenDictionary } from './openDictionary';

const GEMINI_REQUEST_CACHE_TTL_MS = 30_000;
const PERSISTED_CACHE_KEY = 'scheduly-vocabulary-cache-v1';
const PERSISTED_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const GEMINI_REQUEST_CACHE = new Map<string, { timestamp: number; answer: string }>();
const GEMINI_REQUEST_IN_FLIGHT = new Set<string>();

function readPersistedAnswer(cacheKey: string): string | null {
  try {
    const stored = JSON.parse(window.localStorage.getItem(PERSISTED_CACHE_KEY) ?? '{}');
    const cached = stored[cacheKey];
    if (cached && Date.now() - cached.timestamp < PERSISTED_CACHE_TTL_MS) return cached.answer;
    if (cached) delete stored[cacheKey];
    window.localStorage.setItem(PERSISTED_CACHE_KEY, JSON.stringify(stored));
  } catch {
    return null;
  }
  return null;
}

function persistAnswer(cacheKey: string, answer: string): void {
  try {
    const stored = JSON.parse(window.localStorage.getItem(PERSISTED_CACHE_KEY) ?? '{}');
    const entries = Object.entries(stored)
      .filter(([, value]) => Date.now() - (value as { timestamp: number }).timestamp < PERSISTED_CACHE_TTL_MS)
      .slice(-99);
    window.localStorage.setItem(PERSISTED_CACHE_KEY, JSON.stringify(Object.fromEntries([
      ...entries,
      [cacheKey, { timestamp: Date.now(), answer }],
    ])));
  } catch {
    // Cache is an optimization; a blocked localStorage must not block chat.
  }
}

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

  const localAnswer = lookupLocalDictionary(trimmedQuestion);
  if (localAnswer) {
    GEMINI_REQUEST_CACHE.set(cacheKey, { timestamp: Date.now(), answer: localAnswer });
    persistAnswer(cacheKey, localAnswer);
    onUpdate(localAnswer);
    return;
  }

  const openDictionaryAnswer = await lookupOpenDictionary(trimmedQuestion);
  if (openDictionaryAnswer) {
    GEMINI_REQUEST_CACHE.set(cacheKey, { timestamp: Date.now(), answer: openDictionaryAnswer });
    persistAnswer(cacheKey, openDictionaryAnswer);
    onUpdate(openDictionaryAnswer);
    return;
  }

  const cachedResponse = GEMINI_REQUEST_CACHE.get(cacheKey);
  if (cachedResponse && Date.now() - cachedResponse.timestamp < GEMINI_REQUEST_CACHE_TTL_MS) {
    onUpdate(cachedResponse.answer);
    return;
  }

  if (shortVocabularyQuery && typeof window !== 'undefined') {
    const persistedAnswer = readPersistedAnswer(cacheKey);
    if (persistedAnswer) {
      GEMINI_REQUEST_CACHE.set(cacheKey, { timestamp: Date.now(), answer: persistedAnswer });
      onUpdate(persistedAnswer);
      return;
    }
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
    if (shortVocabularyQuery) persistAnswer(cacheKey, answer);
    onUpdate(answer);
  } catch (error) {
    throw classifyGeminiError(error);
  } finally {
    GEMINI_REQUEST_IN_FLIGHT.delete(cacheKey);
  }
}

export { classifyGeminiError, DEFAULT_GEMINI_MODEL, MAX_OUTPUT_TOKENS, normalizeHistory, formatGeminiUserError, isShortVocabularyQuery } from './geminiRequest';