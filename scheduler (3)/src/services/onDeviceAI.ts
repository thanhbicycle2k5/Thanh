import type { ChatTurn, TaskContextItem } from '../lib/aiRequest';

export const ON_DEVICE_AI_MODEL = 'Qwen3-0.6B-q4f16_1-MLC';
const ON_DEVICE_AI_CONTEXT_SIZE = 2048;

const SYSTEM_PROMPT = `You are Scheduly AI, a friendly English-Vietnamese assistant.
Answer directly and concisely, usually in one or two sentences.
Never reveal or narrate your reasoning. For greetings and compliments, reply naturally.
For translations, preserve the meaning and give the natural translation first.
For vocabulary questions, include the word, IPA, part of speech, Vietnamese meaning, and one short example.
Use supplied Scheduly task context only when relevant, and never claim to have changed tasks or settings.
Do not mention that you are a local model unless asked.`;

export type OnDeviceAIProgress = { progress: number; text: string };
type ProgressCallback = (progress: OnDeviceAIProgress) => void;
type OnDeviceAIErrorCode = 'UNAVAILABLE' | 'ABORTED';
export type OnDeviceAIUnavailableReason = 'browser' | 'https' | 'webgpu';

export class OnDeviceAIError extends Error {
  readonly code: OnDeviceAIErrorCode;

  constructor(code: OnDeviceAIErrorCode, message: string) {
    super(message);
    this.name = 'OnDeviceAIError';
    this.code = code;
  }
}

type WebLLMEngine = import('@mlc-ai/web-llm').MLCEngine;

let enginePromise: Promise<WebLLMEngine> | null = null;

export function getOnDeviceAIUnavailableReason(): OnDeviceAIUnavailableReason | null {
  if (typeof window === 'undefined') return 'browser';
  if (!window.isSecureContext) return 'https';
  if (!('gpu' in navigator)) return 'webgpu';
  return null;
}

export async function isOnDeviceAIModelCached(): Promise<boolean> {
  const { hasModelInCache } = await import('@mlc-ai/web-llm');
  return hasModelInCache(ON_DEVICE_AI_MODEL);
}

async function loadEngine(onProgress?: ProgressCallback): Promise<WebLLMEngine> {
  const unavailableReason = getOnDeviceAIUnavailableReason();
  if (unavailableReason) {
    const messages: Record<OnDeviceAIUnavailableReason, string> = {
      browser: 'On-device AI is only available in a browser.',
      https: 'On-device AI requires HTTPS. Open the deployed Scheduly site in Chrome.',
      webgpu: 'This browser does not support WebGPU. Try an up-to-date version of Chrome on Android.',
    };
    throw new OnDeviceAIError('UNAVAILABLE', messages[unavailableReason]);
  }
  if (!enginePromise) {
    enginePromise = import('@mlc-ai/web-llm')
      .then(({ CreateMLCEngine }) => CreateMLCEngine(
        ON_DEVICE_AI_MODEL,
        {
          initProgressCallback: (report) => onProgress?.({
            progress: Math.max(0, Math.min(1, report.progress)),
            text: report.text,
          }),
        },
        { context_window_size: ON_DEVICE_AI_CONTEXT_SIZE },
      ))
      .catch((error: unknown) => {
        enginePromise = null;
        throw new OnDeviceAIError(
          'UNAVAILABLE',
          error instanceof Error
            ? `Unable to load the on-device model: ${error.message}`
            : 'Unable to load the on-device model. Check your browser and available memory, then try again.',
        );
      });
  }
  return enginePromise;
}

export async function prepareOnDeviceAI(onProgress?: ProgressCallback): Promise<void> {
  await loadEngine(onProgress);
}

export async function requestOnDeviceAI(request: {
  question: string;
  history?: ChatTurn[];
  taskContext?: TaskContextItem[];
  signal?: AbortSignal;
  onProgress?: ProgressCallback;
}): Promise<string> {
  const engine = await loadEngine(request.onProgress);
  if (request.signal?.aborted) throw new OnDeviceAIError('ABORTED', 'Generation stopped.');

  const interrupt = () => {
    void engine.interruptGenerate().catch((error: unknown) => {
      console.warn('Failed to interrupt on-device AI generation:', error);
    });
  };
  request.signal?.addEventListener('abort', interrupt, { once: true });

  try {
    const taskContext = request.taskContext?.slice(0, 6) ?? [];
    const systemPrompt = taskContext.length > 0
      ? `${SYSTEM_PROMPT}\n\nRelevant Scheduly tasks:\n${taskContext.map((task) =>
          `- ${task.title} | ${task.date} | ${String(task.startHour).padStart(2, '0')}:${String(task.startMinute ?? 0).padStart(2, '0')} | ${task.duration} min | ${task.completed ? 'completed' : 'unfinished'}`
        ).join('\n')}`
      : SYSTEM_PROMPT;
    const result = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...(request.history ?? []).slice(-4).map((turn) => ({ role: turn.role, content: turn.text.slice(0, 1_200) })),
        { role: 'user', content: request.question.slice(0, 4_000) },
      ],
      temperature: 0.35,
      max_tokens: 400,
      stream: false,
    });
    if (request.signal?.aborted) throw new OnDeviceAIError('ABORTED', 'Generation stopped.');
    const answer = result.choices[0]?.message.content;
    if (typeof answer !== 'string' || !answer.trim()) {
      throw new OnDeviceAIError('UNAVAILABLE', 'The on-device model did not return an answer.');
    }
    return answer.trim();
  } catch (error) {
    if (request.signal?.aborted) throw new OnDeviceAIError('ABORTED', 'Generation stopped.');
    if (error instanceof OnDeviceAIError) throw error;
    enginePromise = null;
    void engine.unload().catch((unloadError: unknown) => {
      console.warn('Failed to release on-device AI after a generation error:', unloadError);
    });
    const message = error instanceof Error ? error.message : String(error ?? '');
    if (/mapasync|buffer was unmapped|device lost/i.test(message)) {
      throw new OnDeviceAIError(
        'UNAVAILABLE',
        'WebGPU stopped while running the model. Close other apps and browser tabs, reload Scheduly, and try again. If it keeps happening, this phone/browser may not have enough compatible GPU memory for on-device AI.',
      );
    }
    throw new OnDeviceAIError(
      'UNAVAILABLE',
      message || 'The on-device model could not generate a reply.',
    );
  } finally {
    request.signal?.removeEventListener('abort', interrupt);
  }
}
