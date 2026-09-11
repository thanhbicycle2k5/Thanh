export const LOCAL_AI_BASE_URL = import.meta.env.DEV ? '/ollama' : 'http://localhost:11434';
export const LOCAL_AI_MODEL = 'qwen3:4b';
export const LOCAL_AI_SYSTEM_PROMPT = `You are Scheduly AI, an expert English-Vietnamese translator, interpreter, language professor and communication assistant.

You specialize in:
- English-Vietnamese translation
- Vietnamese-English translation
- IPA pronunciation
- vocabulary
- collocations
- grammar
- CEFR levels
- natural expressions
- formal/informal register
- pragmatics
- cultural context
- interpreting and translation strategies

For vocabulary:
1. Word
2. IPA
3. Part of speech
4. Vietnamese meanings
5. CEFR level
6. Common collocations
7. Three natural examples
8. Usage/context notes

For translation:
- Give a natural translation first.
- Explain important vocabulary or expressions when useful.
- Preserve the original meaning and context.

Answer clearly and naturally.
Do not mention that you are a local model unless the user asks.`;

export type LocalAIStatus = 'LOCAL_AI_AVAILABLE' | 'LOCAL_AI_UNAVAILABLE';

export class LocalAIError extends Error {
  readonly code: 'UNAVAILABLE' | 'MODEL_NOT_INSTALLED' | 'ABORTED';

  constructor(code: LocalAIError['code'], message: string) {
    super(message);
    this.name = 'LocalAIError';
    this.code = code;
  }
}

type OllamaModel = { name?: string; model?: string };
type OllamaTagsResponse = { models?: OllamaModel[] };
type LocalAIRequest = {
  question: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
  onToken?: (token: string) => void;
  signal?: AbortSignal;
};

function modelName(model: OllamaModel): string {
  return String(model.name ?? model.model ?? '').trim();
}

function hasConfiguredModel(payload: OllamaTagsResponse): boolean {
  return Array.isArray(payload.models) && payload.models.some((model) => {
    const name = modelName(model);
    return name === LOCAL_AI_MODEL || name.startsWith(`${LOCAL_AI_MODEL}:`);
  });
}

async function getTags(signal?: AbortSignal): Promise<OllamaTagsResponse> {
  let response: Response;
  try {
    response = await fetch(`${LOCAL_AI_BASE_URL}/api/tags`, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new LocalAIError('UNAVAILABLE', 'Local AI chưa được bật. Hãy mở Ollama trên máy của bạn.');
  }

  if (!response.ok) {
    throw new LocalAIError('UNAVAILABLE', 'Local AI chưa được bật. Hãy mở Ollama trên máy của bạn.');
  }

  return await response.json() as OllamaTagsResponse;
}

export async function checkLocalAI(signal?: AbortSignal): Promise<LocalAIStatus> {
  try {
    await getTags(signal);
    return 'LOCAL_AI_AVAILABLE';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return 'LOCAL_AI_UNAVAILABLE';
  }
}

function toOllamaMessages(request: LocalAIRequest) {
  return [
    { role: 'system', content: LOCAL_AI_SYSTEM_PROMPT },
    ...(request.history ?? []).map((turn) => ({ role: turn.role, content: turn.text })),
    { role: 'user', content: request.question },
  ];
}

export async function requestLocalAI(request: LocalAIRequest): Promise<string> {
  const tags = await getTags(request.signal);
  if (!hasConfiguredModel(tags)) {
    throw new LocalAIError('MODEL_NOT_INSTALLED', `Model Local AI chưa được cài đặt. Hãy cài Ollama và model ${LOCAL_AI_MODEL}.`);
  }

  let response: Response;
  try {
    response = await fetch(`${LOCAL_AI_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LOCAL_AI_MODEL,
        messages: toOllamaMessages(request),
        stream: true,
        keep_alive: '10m',
        options: { temperature: 0.35 },
      }),
      signal: request.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new LocalAIError('ABORTED', 'Local AI generation stopped.');
    }
    throw new LocalAIError('UNAVAILABLE', 'Local AI chưa được bật. Hãy mở Ollama trên máy của bạn.');
  }

  if (!response.ok || !response.body) {
    throw new LocalAIError('UNAVAILABLE', 'Local AI chưa được bật. Hãy mở Ollama trên máy của bạn.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let answer = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        const chunk = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
        const token = chunk.message?.content ?? '';
        if (token) {
          answer += token;
          request.onToken?.(token);
        }
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      const chunk = JSON.parse(buffer) as { message?: { content?: string } };
      const token = chunk.message?.content ?? '';
      if (token) {
        answer += token;
        request.onToken?.(token);
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new LocalAIError('ABORTED', 'Local AI generation stopped.');
    }
    try {
      const retryResponse = await fetch(`${LOCAL_AI_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: LOCAL_AI_MODEL,
          messages: toOllamaMessages(request),
          stream: false,
          keep_alive: '10m',
          options: { temperature: 0.35 },
        }),
        signal: request.signal,
      });
      const retryPayload = await retryResponse.json().catch(() => null) as { message?: { content?: string } } | null;
      const retryAnswer = retryPayload?.message?.content ?? '';
      if (retryResponse.ok && retryAnswer.trim()) {
        request.onToken?.(retryAnswer);
        return retryAnswer;
      }
    } catch (retryError) {
      if (retryError instanceof DOMException && retryError.name === 'AbortError') {
        throw new LocalAIError('ABORTED', 'Local AI generation stopped.');
      }
    }
    throw new LocalAIError('UNAVAILABLE', 'Local AI trả về dữ liệu không hợp lệ.');
  } finally {
    reader.releaseLock();
  }

  if (!answer.trim()) throw new LocalAIError('UNAVAILABLE', 'Local AI không trả về câu trả lời.');
  return answer;
}
