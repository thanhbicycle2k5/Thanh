import type { LocalAIModel } from '../types';
import { parseFinalAnswer } from '../lib/localAIResponse';

export const LOCAL_AI_BASE_URL = import.meta.env.DEV ? '/ollama' : 'http://localhost:11434';
export const LOCAL_AI_MODEL: LocalAIModel = 'qwen3:4b';
export const LOCAL_AI_SYSTEM_PROMPT = `You are Scheduly AI, a friendly English-Vietnamese assistant.
Answer directly and concisely, usually in one or two sentences.
Never reveal or narrate your reasoning. For greetings and compliments, reply naturally.
For translations, preserve the meaning and give the natural translation first.
For vocabulary questions, include the word, IPA, part of speech, Vietnamese meaning, and one short example.
Do not mention that you are a local model unless asked.`;

export type LocalAIStatus = 'LOCAL_AI_AVAILABLE' | 'LOCAL_AI_MODEL_NOT_INSTALLED' | 'LOCAL_AI_UNAVAILABLE';

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
  model: LocalAIModel;
  question: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
  onToken?: (token: string) => void;
  signal?: AbortSignal;
};

function modelName(model: OllamaModel): string {
  return String(model.name ?? model.model ?? '').trim();
}

function hasConfiguredModel(payload: OllamaTagsResponse, requestedModel: LocalAIModel): boolean {
  return Array.isArray(payload.models) && payload.models.some((installedModel) => {
    const name = modelName(installedModel);
    return name === requestedModel || name.startsWith(`${requestedModel}:`);
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

export async function checkLocalAI(model: LocalAIModel, signal?: AbortSignal): Promise<LocalAIStatus> {
  try {
    const tags = await getTags(signal);
    return hasConfiguredModel(tags, model) ? 'LOCAL_AI_AVAILABLE' : 'LOCAL_AI_MODEL_NOT_INSTALLED';
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
  if (!hasConfiguredModel(tags, request.model)) {
    throw new LocalAIError('MODEL_NOT_INSTALLED', `Model Local AI chưa được cài đặt. Hãy cài Ollama và model ${request.model}.`);
  }

  try {
    const response = await fetch(`${LOCAL_AI_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: toOllamaMessages(request),
        think: false,
        stream: false,
        format: {
          type: 'object',
          properties: {
            answer: { type: 'string' },
          },
          required: ['answer'],
          additionalProperties: false,
        },
        keep_alive: '10m',
        options: { temperature: 0.2, num_predict: 192 },
      }),
      signal: request.signal,
    });
    if (!response.ok) {
      throw new LocalAIError('UNAVAILABLE', 'Ollama không thể tạo câu trả lời. Hãy kiểm tra model Local AI đã chọn.');
    }

    const payload = await response.json() as {
      message?: { content?: string; thinking?: string };
    };
    const answer = parseFinalAnswer(payload.message?.content ?? '');
    if (!answer) throw new LocalAIError('UNAVAILABLE', 'Local AI không trả về câu trả lời.');
    request.onToken?.(answer);
    return answer;
  } catch (error) {
    if (error instanceof LocalAIError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new LocalAIError('ABORTED', 'Local AI generation stopped.');
    }
    throw new LocalAIError('UNAVAILABLE', 'Local AI chưa được bật hoặc không thể tạo câu trả lời.');
  }
}
