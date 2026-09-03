const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const DICTIONARY_DIR = path.join(__dirname, '..', 'public', 'dictionary');
const FAILED_WORDS_FILE = path.join(require('os').tmpdir(), 'scheduly-vietnamese-dictionary-failed.json');
const PRIORITY_WORDS = `automation blockchain chatbot clickbait cloud-computing content-creator cryptocurrency cybersecurity data-driven deepfake disinformation doomscrolling e-commerce edtech emoji fintech hashtag livestream metaverse mocktail nanotechnology podcast ransomware remote-work selfie smartphone telehealth tiktok viral wearable`.split(/\s+/);

function readShard(file) {
  const fullPath = path.join(DICTIONARY_DIR, file);
  if (!fs.existsSync(fullPath)) return {};
  return JSON.parse(zlib.brotliDecompressSync(fs.readFileSync(fullPath)));
}

function cleanTranslation(value) {
  return String(value ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/&(?:amp|lt|gt|quot|#39|#10|#13);/g, (entity) => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#10;': ' ', '&#13;': ' ' }[entity]))
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchTranslation(word) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`;
  const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
  if (!response.ok) return null;
  const data = await response.json();
  const translation = cleanTranslation(data?.responseData?.translatedText);
  if (!translation || translation.toLowerCase() === word.toLowerCase()) return null;
  return translation;
}

(async () => {
  const english = {};
  const vietnamese = {};
  for (const file of fs.readdirSync(DICTIONARY_DIR).filter((name) => name.startsWith('en-') && name.endsWith('.json.br'))) {
    Object.assign(english, readShard(file));
  }
  for (const file of fs.readdirSync(DICTIONARY_DIR).filter((name) => name.startsWith('vi-') && name.endsWith('.json.br'))) {
    Object.assign(vietnamese, readShard(file));
  }

  let failedWords = [];
  try { failedWords = JSON.parse(fs.readFileSync(FAILED_WORDS_FILE, 'utf8')); } catch {}
  const failed = new Set(failedWords);
  const candidates = Object.keys(english).filter((candidate) => /^[a-z]+(?:[-'][a-z]+)*$/i.test(candidate) && candidate.length >= 2 && !vietnamese[candidate] && !failed.has(candidate));
  const words = [...new Set([...PRIORITY_WORDS, ...candidates])]
    .filter((candidate) => candidates.includes(candidate))
    .slice(0, 20);
  if (!words.length) {
    console.log('DONE: no untranslated candidate available in the current queue.');
    return;
  }

  for (const word of words) {
    try {
      const translation = await fetchTranslation(word);
      if (!translation) {
        failed.add(word);
        fs.writeFileSync(FAILED_WORDS_FILE, JSON.stringify([...failed]));
        console.log(`SKIP: ${word}`);
        continue;
      }
      const shardName = /^[a-z]$/i.test(word[0]) ? word[0].toLowerCase() : 'other';
      const file = `vi-${shardName}.json.br`;
      const shard = readShard(file);
      shard[word] = translation;
      const sorted = Object.fromEntries(Object.entries(shard).sort(([a], [b]) => a.localeCompare(b)));
      fs.writeFileSync(path.join(DICTIONARY_DIR, file), zlib.brotliCompressSync(Buffer.from(JSON.stringify(sorted))));
      console.log(`ADDED: ${word} -> ${translation}`);
    } catch (error) {
      failed.add(word);
      fs.writeFileSync(FAILED_WORDS_FILE, JSON.stringify([...failed]));
      console.log(`SKIP: ${word} (${error.name === 'TimeoutError' ? 'timeout' : error.message})`);
    }
  }
})();
