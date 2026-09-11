const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const sourceFile = process.argv[2] || path.join(require('os').tmpdir(), 'anhviet109K.txt');
const dictionaryDir = path.join(__dirname, '..', 'public', 'dictionary');

if (!fs.existsSync(sourceFile)) {
  throw new Error(`Source file not found: ${sourceFile}`);
}

function readShard(file) {
  const fullPath = path.join(dictionaryDir, file);
  if (!fs.existsSync(fullPath)) return {};
  return JSON.parse(zlib.brotliDecompressSync(fs.readFileSync(fullPath)));
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/^[-*]\s*/, '')
    .trim();
}

function parseHeadword(line) {
  const raw = line.slice(1).trim();
  return raw.replace(/\s+\/.*\/$/, '').trim().toLowerCase();
}

function parseBlock(lines) {
  const headword = parseHeadword(lines[0]);
  if (!headword || !/^[a-zà-ỹ0-9][a-zà-ỹ0-9 .&'()/+-]*$/i.test(headword)) return null;

  const translations = [];
  for (const line of lines.slice(1)) {
    if (line.startsWith('-')) {
      const translation = cleanText(line);
      if (translation) translations.push(translation);
      continue;
    }
    if (line.startsWith('=')) {
      const separator = line.indexOf('+');
      const translation = separator >= 0 ? cleanText(line.slice(separator + 1)) : '';
      if (translation) translations.push(translation);
    }
  }

  const uniqueTranslations = [...new Set(translations)].slice(0, 24);
  return uniqueTranslations.length ? { headword, value: uniqueTranslations.join('; ') } : null;
}

const content = fs.readFileSync(sourceFile, 'utf8');
const shards = {};
let block = [];
let imported = 0;

function commit() {
  if (!block.length) return;
  const entry = parseBlock(block);
  if (entry) {
    const firstCharacter = entry.headword.charAt(0);
    const shardName = /^[a-z]$/i.test(firstCharacter) ? firstCharacter.toLowerCase() : 'other';
    const file = `vi-${shardName}.json.br`;
    shards[file] ??= readShard(file);
    if (!shards[file][entry.headword]) {
      shards[file][entry.headword] = entry.value;
      imported += 1;
    }
  }
  block = [];
}

for (const line of content.split(/\r?\n/)) {
  if (line.startsWith('@')) {
    commit();
    block = [line];
  } else if (block.length) {
    block.push(line);
  }
}
commit();

for (const [file, shard] of Object.entries(shards)) {
  const sorted = Object.fromEntries(Object.entries(shard).sort(([left], [right]) => left.localeCompare(right)));
  fs.writeFileSync(path.join(dictionaryDir, file), zlib.brotliCompressSync(Buffer.from(JSON.stringify(sorted)), { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }));
}

console.log(`Imported ${imported} Vietnamese dictionary entries into ${Object.keys(shards).length} shards.`);
