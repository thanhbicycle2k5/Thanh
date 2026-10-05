import * as FileSystem from 'expo-file-system/legacy';
import { initLlama, type LlamaContext, releaseAllLlama } from 'llama.rn';

const MODEL_URL = 'https://huggingface.co/ggml-org/SmolLM3-3B-GGUF/resolve/4965cb60b150737b68a0408c36aeefb65078f894/SmolLM3-Q4_K_M.gguf?download=true';
const MODEL_FILENAME = 'SmolLM3-Q4_K_M.gguf';
const MODEL_SIZE_BYTES = 1_915_305_312;
const MODEL_URI = `${FileSystem.documentDirectory}models/${MODEL_FILENAME}`;
const MODEL_DIRECTORY = `${FileSystem.documentDirectory}models`;

type Progress = { progress: number; text: string };
type ProgressCallback = (progress: Progress) => void;
type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

let contextPromise: Promise<LlamaContext> | null = null;
let activeContext: LlamaContext | null = null;

async function hasModelFile(): Promise<boolean> {
  if (!MODEL_URI.startsWith('file://')) throw new Error('Android app storage is unavailable.');
  const info = await FileSystem.getInfoAsync(MODEL_URI);
  return info.exists && info.size === MODEL_SIZE_BYTES;
}

async function downloadModel(onProgress: ProgressCallback): Promise<void> {
  if (await hasModelFile()) return;
  await FileSystem.makeDirectoryAsync(MODEL_DIRECTORY, { intermediates: true });
  const existingFile = await FileSystem.getInfoAsync(MODEL_URI);
  if (existingFile.exists) await FileSystem.deleteAsync(MODEL_URI, { idempotent: true });

  onProgress({ progress: 0, text: 'Downloading SmolLM3 3B Q4_K_M' });
  const download = FileSystem.createDownloadResumable(
    MODEL_URL,
    MODEL_URI,
    {},
    (state) => {
      const total = state.totalBytesExpectedToWrite;
      const progress = total > 0 ? Math.min(1, state.totalBytesWritten / total) : 0;
      onProgress({ progress, text: 'Downloading SmolLM3 3B Q4_K_M' });
    },
  );
  const result = await download.downloadAsync();
  if (!result || !(await hasModelFile())) {
    await FileSystem.deleteAsync(MODEL_URI, { idempotent: true });
    throw new Error('Model download was incomplete. Please try again.');
  }
}

async function loadModel(onProgress: ProgressCallback): Promise<LlamaContext> {
  if (!contextPromise) {
    contextPromise = (async () => {
      await downloadModel(onProgress);
      onProgress({ progress: 1, text: 'Loading SmolLM3 3B into native runtime' });
      try {
        activeContext = await initLlama({
          model: MODEL_URI,
          n_ctx: 2048,
          n_batch: 128,
          n_threads: 4,
          n_gpu_layers: 99,
          use_mlock: false,
        }, (progress) => {
          onProgress({ progress: Math.max(0, Math.min(1, progress / 100)), text: 'Loading model' });
        });
      } catch (gpuError) {
        console.warn('Native GPU acceleration was unavailable; retrying with CPU:', gpuError);
        await releaseAllLlama().catch((releaseError: unknown) => {
          console.warn('Unable to release failed GPU model initialization:', releaseError);
        });
        activeContext = await initLlama({
          model: MODEL_URI,
          n_ctx: 2048,
          n_batch: 128,
          n_threads: 4,
          n_gpu_layers: 0,
          use_mlock: false,
        }, (progress) => {
          onProgress({ progress: Math.max(0, Math.min(1, progress / 100)), text: 'Loading model on CPU' });
        });
      }
      return activeContext;
    })().catch((error: unknown) => {
      contextPromise = null;
      throw error;
    });
  }
  return contextPromise;
}

function normalizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) throw new Error('Invalid chat request.');
  const messages = value.slice(-6).map((item) => {
    const message = item as Partial<ChatMessage>;
    if (!['system', 'user', 'assistant'].includes(String(message.role)) || typeof message.content !== 'string') {
      throw new Error('Invalid chat message.');
    }
    return {
      role: message.role as ChatMessage['role'],
      content: message.content.slice(0, message.role === 'system' ? 8_000 : 4_000),
    };
  });
  if (messages[0]?.role !== 'system' || messages.at(-1)?.role !== 'user') {
    throw new Error('Chat requires a system prompt first and a user message last.');
  }
  return messages;
}

export async function handleNativeAIRequest(
  action: string,
  payload: Record<string, unknown>,
  onProgress: ProgressCallback,
): Promise<unknown> {
  if (action === 'status') {
    return { cached: await hasModelFile(), model: MODEL_FILENAME };
  }
  if (action === 'prepare') {
    await loadModel(onProgress);
    return { ready: true, model: MODEL_FILENAME };
  }
  if (action === 'cancel') {
    if (activeContext) await activeContext.stopCompletion();
    return { cancelled: true };
  }
  if (action === 'chat') {
    const context = await loadModel(onProgress);
    const result = await context.completion({
      messages: normalizeMessages(payload.messages),
      n_predict: 300,
      temperature: 0.35,
    });
    if (!result.text.trim()) throw new Error('SmolLM3 did not return an answer.');
    return { answer: result.text.trim() };
  }
  throw new Error('Unsupported native AI action.');
}
