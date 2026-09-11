const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const dictionaryDir = path.join(__dirname, '..', 'public', 'dictionary');
const readShard = (file) => JSON.parse(zlib.brotliDecompressSync(fs.readFileSync(path.join(dictionaryDir, file))));
const writeShard = (file, data) => fs.writeFileSync(path.join(dictionaryDir, file), zlib.brotliCompressSync(Buffer.from(JSON.stringify(data)), { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }));

const vietnamese = {};
for (const file of fs.readdirSync(dictionaryDir).filter((name) => name.startsWith('vi-') && name.endsWith('.json.br'))) {
  Object.assign(vietnamese, readShard(file));
}

let removed = 0;
for (const file of fs.readdirSync(dictionaryDir).filter((name) => name.startsWith('en-') && name.endsWith('.json.br'))) {
  const source = readShard(file);
  const filtered = {};
  for (const [key, definition] of Object.entries(source)) {
    const normalized = key.replace(/\s+/g, ' ').toLowerCase();
    const hyphenated = normalized.replace(/\s+/g, '-');
    const spaced = normalized.replace(/-/g, ' ');
    if (vietnamese[normalized] || vietnamese[hyphenated] || vietnamese[spaced]) {
      filtered[key] = definition;
    } else {
      removed += 1;
    }
  }
  writeShard(file, Object.fromEntries(Object.entries(filtered).sort(([left], [right]) => left.localeCompare(right))));
}

console.log(`Removed ${removed} English entries without a local Vietnamese translation.`);
