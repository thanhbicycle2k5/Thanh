const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const sourceUrl = 'https://raw.githubusercontent.com/WithEnglishWeCan/generated-english-phrasal-verbs/master/phrasal.verbs.build.json';
const dictionaryDir = path.join(__dirname, '..', 'public', 'dictionary');
const sourceFile = path.join(require('os').tmpdir(), 'phrasal.verbs.build.json');
const phraseLimit = Number(process.env.PHRASAL_LIMIT || 0);

function readShard(prefix, key) {
  const first = key.charAt(0);
  const shard = /^[a-z]$/i.test(first) ? first.toLowerCase() : 'other';
  const file = `${prefix}-${shard}.json.br`;
  const fullPath = path.join(dictionaryDir, file);
  return {
    file,
    data: fs.existsSync(fullPath) ? JSON.parse(zlib.brotliDecompressSync(fs.readFileSync(fullPath))) : {},
  };
}

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function formatEnglish(entry) {
  const descriptions = (entry.descriptions || []).map(clean).filter(Boolean).slice(0, 8);
  const examples = (entry.examples || []).map(clean).filter(Boolean).slice(0, 6);
  return `${descriptions.join(' ')}${examples.length ? ` Examples: ${examples.join(' | ')}` : ''}`;
}

function importPhrase(phrase, entry, vietnamese) {
  const englishShard = readShard('en', phrase);
  const vietnameseShard = readShard('vi', phrase);
  const english = formatEnglish(entry);
  const translation = clean(vietnamese);
  if (!english || !translation) return false;
  englishShard.data[phrase] ??= english;
  vietnameseShard.data[phrase] ??= translation;
  importPhrase.shards.set(englishShard.file, englishShard.data);
  importPhrase.shards.set(vietnameseShard.file, vietnameseShard.data);
  return true;
}
importPhrase.shards = new Map();

async function fetchJson() {
  const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`Phrasal verb source returned ${response.status}`);
  return await response.json();
}

(async () => {
  const dataset = await fetchJson();
  const entries = Object.entries(dataset).slice(0, phraseLimit || undefined);
  let imported = 0;
  for (const [phrase, entry] of entries) {
    // Known translations are kept here as deterministic seed data. Add more from a reviewed source as needed.
    const vietnamese = {
      'abide by': 'tuân theo, chấp hành',
      'account for': 'giải thích; chiếm; chịu trách nhiệm về',
      'break down': 'hỏng; suy sụp; phân tích, chia nhỏ',
      'break up': 'chia tay; giải tán; vỡ ra',
      'bring up': 'nuôi nấng; đề cập; nêu ra',
      'call off': 'hủy bỏ',
      'carry on': 'tiếp tục',
      'come across': 'tình cờ gặp; tạo ấn tượng',
      'cut down': 'cắt giảm; chặt hạ',
      'find out': 'tìm ra, phát hiện',
      'get along': 'hòa thuận, hòa hợp',
      'get over': 'vượt qua; hồi phục',
      'give up': 'từ bỏ',
      'go on': 'tiếp tục; xảy ra',
      'look after': 'chăm sóc',
      'look for': 'tìm kiếm',
      'look forward to': 'mong đợi',
      'look into': 'điều tra, xem xét',
      'make up': 'bịa ra; làm hòa; trang điểm',
      'put off': 'trì hoãn; làm ai mất hứng',
      'put up with': 'chịu đựng',
      'run out of': 'hết, cạn kiệt',
      'take after': 'giống, giống về ngoại hình/tính cách',
      'take off': 'cởi ra; cất cánh; thành công nhanh',
      'take over': 'tiếp quản, đảm nhận',
      'turn down': 'từ chối; vặn nhỏ',
      'work out': 'tập luyện; tìm ra giải pháp; diễn ra tốt đẹp',
      'take responsibility': 'chịu trách nhiệm',
      'gender equality': 'bình đẳng giới',
      'climate change': 'biến đổi khí hậu',
      'human rights': 'nhân quyền',
      'make a decision': 'đưa ra quyết định',
      'pay attention': 'chú ý',
      'take part': 'tham gia',
      'keep in touch': 'giữ liên lạc',
      'in charge of': 'phụ trách, chịu trách nhiệm về',
      'as a result': 'kết quả là, do đó',
      'by the way': 'nhân tiện, tiện thể',
      'in order to': 'để, nhằm mục đích',
      'on the other hand': 'mặt khác',
      'piece of cake': 'việc rất dễ dàng',
      'once in a blue moon': 'rất hiếm khi',
      'break the ice': 'phá tan sự ngượng ngùng ban đầu',
      'hit the nail on the head': 'nói đúng trọng tâm',
      'under the weather': 'cảm thấy không khỏe',
      'cost an arm and a leg': 'cực kỳ đắt đỏ',
      'better late than never': 'muộn còn hơn không',
    }[phrase];
    if (importPhrase(phrase, entry, vietnamese)) imported += 1;
  }

  const reviewedPhrases = {
    'take responsibility': ['to accept responsibility for something', 'chịu trách nhiệm'],
    'gender equality': ['the equal rights and opportunities of people of all genders', 'bình đẳng giới'],
    'climate change': ['long-term changes in the Earth’s climate', 'biến đổi khí hậu'],
    'human rights': ['the basic rights and freedoms that belong to every person', 'nhân quyền'],
    'piece of cake': ['something that is very easy to do', 'việc rất dễ dàng'],
    'once in a blue moon': ['very rarely', 'rất hiếm khi'],
    'break the ice': ['to make people feel more comfortable in a new social situation', 'phá tan sự ngượng ngùng ban đầu'],
  };
  for (const [phrase, [definition, translation]] of Object.entries(reviewedPhrases)) {
    if (importPhrase(phrase, { descriptions: [definition], examples: [] }, translation)) imported += 1;
  }

  for (const [file, data] of importPhrase.shards) {
    const sorted = Object.fromEntries(Object.entries(data).sort(([left], [right]) => left.localeCompare(right)));
    fs.writeFileSync(path.join(dictionaryDir, file), zlib.brotliCompressSync(Buffer.from(JSON.stringify(sorted)), { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }));
  }
  console.log(`Imported ${imported} reviewed Vietnamese phrasal-verb entries from ${entries.length} downloaded entries.`);
})();
