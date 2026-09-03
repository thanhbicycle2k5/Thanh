import { normalizeDictionaryQuery } from './localDictionary';

type DictionaryShard = Record<string, string>;

const shardCache = new Map<string, DictionaryShard>();
const shardRequests = new Map<string, Promise<DictionaryShard>>();
const translationCache = new Map<string, DictionaryShard>();
const translationRequests = new Map<string, Promise<DictionaryShard>>();

function getShardName(word: string): string {
  const firstCharacter = word.charAt(0);
  return /^[a-z]$/i.test(firstCharacter) ? firstCharacter.toLowerCase() : 'other';
}

async function loadTranslationShard(shardName: string): Promise<DictionaryShard> {
  const cachedShard = translationCache.get(shardName);
  if (cachedShard) return cachedShard;
  const pendingRequest = translationRequests.get(shardName);
  if (pendingRequest) return pendingRequest;

  const request = fetch(`/dictionary/vi-${shardName}.json.br`)
    .then((response) => response.ok ? response.json() as Promise<DictionaryShard> : {})
    .then((shard) => {
      translationCache.set(shardName, shard);
      translationRequests.delete(shardName);
      return shard;
    })
    .catch(() => {
      translationRequests.delete(shardName);
      return {};
    });
  translationRequests.set(shardName, request);
  return request;
}

async function loadShard(shardName: string): Promise<DictionaryShard> {
  const cachedShard = shardCache.get(shardName);
  if (cachedShard) return cachedShard;

  const pendingRequest = shardRequests.get(shardName);
  if (pendingRequest) return pendingRequest;

  const request = fetch(`/dictionary/en-${shardName}.json.br`)
    .then((response) => {
      if (!response.ok) throw new Error(`Dictionary shard unavailable: ${shardName}`);
      return response.json() as Promise<DictionaryShard>;
    })
    .then((shard) => {
      shardCache.set(shardName, shard);
      shardRequests.delete(shardName);
      return shard;
    })
    .catch((error) => {
      shardRequests.delete(shardName);
      throw error;
    });

  shardRequests.set(shardName, request);
  return request;
}

function formatOpenDictionaryEntry(word: string, definition: string, vietnamese?: string): string {
  const definitionParts = definition
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const readableParts: string[] = [];

  for (const part of definitionParts) {
    const previous = readableParts[readableParts.length - 1];
    if (/^\d+\.$/.test(part)) {
      readableParts.push(part);
      continue;
    }
    if (/^\d+\.$/.test(previous ?? '')) {
      readableParts[readableParts.length - 1] = `${previous} ${part}`;
      continue;
    }
    readableParts.push(part);
  }

  const readableDefinition = readableParts.slice(0, 12).join('\n\n');

  return `### WORD\n**${word}**\n\n### MEANING\n${readableDefinition || '- Meaning not available.'}\n\n### VIETNAMESE\n${vietnamese || 'Scheduly chưa có bản dịch tiếng Việt trong dữ liệu local.'}\n\n_Source: Local Open Dictionary_`;
}

export async function lookupOpenDictionary(query: string): Promise<string | null> {
  const normalizedQuery = normalizeDictionaryQuery(query);
  if (!/^[a-z]+(?:[-'][a-z]+)?$/i.test(normalizedQuery)) return null;

  try {
    const shard = await loadShard(getShardName(normalizedQuery));
    const definition = shard[normalizedQuery.toLowerCase()];
    const translations = await loadTranslationShard(getShardName(normalizedQuery));
    return typeof definition === 'string' && definition.trim()
      ? formatOpenDictionaryEntry(normalizedQuery, definition.trim(), translations[normalizedQuery.toLowerCase()])
      : null;
  } catch {
    return null;
  }
}
