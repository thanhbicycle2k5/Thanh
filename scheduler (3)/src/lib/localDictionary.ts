type DictionaryEntry = {
  word: string;
  ipa: string;
  partOfSpeech: string;
  vietnamese: string;
  english: string;
  cefr: string;
  examples: Array<{ english: string; vietnamese: string }>;
};

const DICTIONARY: Record<string, DictionaryEntry> = {
  betel: {
    word: 'betel',
    ipa: '/ˈbiː.təl/',
    partOfSpeech: 'noun',
    vietnamese: 'trầu, lá trầu không',
    english: 'the leaf of a climbing plant, traditionally chewed with areca nut',
    cefr: 'B2',
    examples: [
      { english: 'She wrapped the areca nut in a betel leaf.', vietnamese: 'Cô ấy gói cau trong lá trầu.' },
      { english: 'Betel leaves are used in some traditional ceremonies.', vietnamese: 'Lá trầu được dùng trong một số nghi lễ truyền thống.' },
      { english: 'My grandmother grows betel in her garden.', vietnamese: 'Bà tôi trồng trầu trong vườn.' },
    ],
  },
  sustainable: {
    word: 'sustainable',
    ipa: '/səˈsteɪ.nə.bəl/',
    partOfSpeech: 'adjective',
    vietnamese: 'bền vững; có thể duy trì lâu dài',
    english: 'able to continue without causing serious harm or using resources up',
    cefr: 'B2',
    examples: [
      { english: 'We need more sustainable energy sources.', vietnamese: 'Chúng ta cần thêm các nguồn năng lượng bền vững.' },
      { english: 'The company is developing sustainable packaging.', vietnamese: 'Công ty đang phát triển bao bì thân thiện và bền vững.' },
      { english: 'This plan is not financially sustainable.', vietnamese: 'Kế hoạch này không thể duy trì về mặt tài chính.' },
    ],
  },
  translation: {
    word: 'translation',
    ipa: '/trænzˈleɪ.ʃən/',
    partOfSpeech: 'noun',
    vietnamese: 'bản dịch; sự biên dịch',
    english: 'the process or result of changing words into another language',
    cefr: 'B1',
    examples: [
      { english: 'I checked the translation against the original text.', vietnamese: 'Tôi đối chiếu bản dịch với văn bản gốc.' },
      { english: 'The translation sounds natural in Vietnamese.', vietnamese: 'Bản dịch nghe tự nhiên trong tiếng Việt.' },
      { english: 'This poem is difficult to translate.', vietnamese: 'Bài thơ này khó dịch.' },
    ],
  },
  'bền vững': {
    word: 'bền vững',
    ipa: '/ˌbɛn ˈvɨŋ/',
    partOfSpeech: 'adjective',
    vietnamese: 'sustainable; lasting and able to continue',
    english: 'able to last or continue without causing harm',
    cefr: 'B2',
    examples: [
      { english: 'Sustainable development protects future generations.', vietnamese: 'Phát triển bền vững bảo vệ các thế hệ tương lai.' },
      { english: 'We are looking for a sustainable solution.', vietnamese: 'Chúng tôi đang tìm một giải pháp bền vững.' },
      { english: 'The project created sustainable jobs.', vietnamese: 'Dự án tạo ra những việc làm ổn định lâu dài.' },
    ],
  },
};

function formatEntry(entry: DictionaryEntry): string {
  const examples = entry.examples
    .map((example) => `- **${example.english}**\n  ${example.vietnamese}`)
    .join('\n');

  return `### WORD\n**${entry.word}**\n\n### IPA\n${entry.ipa}\n\n### PART OF SPEECH\n${entry.partOfSpeech}\n\n### MEANING\n- Vietnamese: ${entry.vietnamese}\n- English: ${entry.english}\n\n### CEFR\n${entry.cefr}\n\n### EXAMPLES\n${examples}`;
}

export function lookupLocalDictionary(query: string): string | null {
  const key = String(query ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  const entry = DICTIONARY[key];
  return entry ? formatEntry(entry) : null;
}
