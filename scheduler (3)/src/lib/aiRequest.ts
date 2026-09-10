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
    && trimmedQuery.length <= 80
    && words.length <= 4
    && !/[?!。？！]/.test(trimmedQuery);
}

export function formatAIUserError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lower = message.toLowerCase();
  if (lower.includes('today') && lower.includes('limit')) return "Today's free AI limit has been reached. Please try again tomorrow.";
  if (lower.includes('sign in')) return 'Please sign in to use Scheduly AI.';
  if (lower.includes('free ai limit') || lower.includes('no free model')) return 'AI is temporarily unavailable because the free AI limit has been reached. Please try again later.';
  if (lower.includes('network') || lower.includes('fetch')) return 'AI is temporarily unavailable. Please check your connection and try again.';
  return 'AI is temporarily unavailable. Please try again later.';
}
