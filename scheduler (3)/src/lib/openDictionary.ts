import { normalizeDictionaryQuery } from './localDictionary';

type DictionaryShard = Record<string, string>;

const shardCache = new Map<string, DictionaryShard>();
const shardRequests = new Map<string, Promise<DictionaryShard>>();

function getShardName(word: string): string {
  const firstCharacter = word.charAt(0);
  return /^[a-z]$/i.test(firstCharacter) ? firstCharacter.toLowerCase() : 'other';
}

async function loadShard(shardName: string): Promise<DictionaryShard> {
  const cachedShard = shardCache.get(shardName);
  if (cachedShard) return cachedShard;

  const pendingRequest = shardRequests.get(shardName);
  if (pendingRequest) return pendingRequest;

  const request = fetch(`/dictionary/en-${shardName}.json`)
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

function formatOpenDictionaryEntry(word: string, definition: string): string {
  return `### WORD\n**${word}**\n\n### MEANING\n${definition}\n\n### VIETNAMESE\nScheduly chưa có bản dịch tiếng Việt trong dữ liệu local.\n\n_Source: Local Open Dictionary_`;
}

export async function lookupOpenDictionary(query: string): Promise<string | null> {
  const normalizedQuery = normalizeDictionaryQuery(query);
  if (!/^[a-z]+(?:[-'][a-z]+)?$/i.test(normalizedQuery)) return null;

  try {
    const shard = await loadShard(getShardName(normalizedQuery));
    const definition = shard[normalizedQuery.toLowerCase()];
    return typeof definition === 'string' && definition.trim()
      ? formatOpenDictionaryEntry(normalizedQuery, definition.trim())
      : null;
  } catch {
    return null;
  }
}
