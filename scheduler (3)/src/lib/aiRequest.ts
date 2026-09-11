export const FREE_AI_MODEL = 'openrouter/free';
export const MAX_HISTORY_TURNS = 8;

export type ChatTurn = {
  role: 'user' | 'assistant';
  text: string;
};

export type TaskContextItem = {
  title: string;
  date: string;
  startHour: number;
  startMinute?: number;
  duration: number;
  completed?: boolean;
};

export function normalizeHistory(history: ChatTurn[] = []): ChatTurn[] {
  return (Array.isArray(history) ? history : [])
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({
      role: turn?.role === 'assistant' ? 'assistant' as const : 'user' as const,
      text: String(turn?.text ?? '').trim().slice(0, 4_000),
    }))
    .filter((turn) => turn.text.length > 0);
}

export function isShortVocabularyQuery(query: string): boolean {
  const trimmedQuery = String(query ?? '').trim();
  const words = trimmedQuery.split(/\s+/).filter(Boolean);
  return trimmedQuery.length > 0
    && trimmedQuery.length <= 120
    && words.length <= 8
    && !/[?!。？！]/.test(trimmedQuery);
}

export function isDictionaryLookupQuery(query: string): boolean {
  const trimmedQuery = String(query ?? '').trim();
  return isShortVocabularyQuery(trimmedQuery)
    || /^what\s+does\s+this\s+word\s+mean[,.!?\s]+[^?]{1,100}[?!.,]?$/i.test(trimmedQuery)
    || /^what\s+(?:does|do)\s+(?:this\s+word\s+mean[,.!?\s]+)?[^?]{1,100}\s+mean[?!.,]?$/i.test(trimmedQuery)
    || /^(?:meaning of|define|dịch|nghĩa của)\s+.{1,100}[?!.,]?$/i.test(trimmedQuery);
}

export function formatAIUserError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lower = message.toLowerCase();
  if (lower.includes('local ai chưa được bật')) return 'Local AI chưa được bật. Hãy mở Ollama trên máy của bạn.';
  if (lower.includes('model local ai chưa được cài đặt')) return message;
  if (lower.includes('generation stopped')) return 'Đã dừng tạo câu trả lời.';
  if (lower.includes('today') && lower.includes('limit')) return "Today's free AI limit has been reached. Please try again tomorrow.";
  if (lower.includes('free ai limit') || lower.includes('no free model') || lower.includes('quota')) return 'Gemini đang hết giới hạn sử dụng. Scheduly vẫn có thể sử dụng Local AI.';
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) return 'Không có kết nối Internet.';
  return 'AI is temporarily unavailable. Please try again later.';
}
