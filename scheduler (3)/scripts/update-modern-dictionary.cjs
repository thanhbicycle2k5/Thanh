const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const DICTIONARY_DIR = path.join(__dirname, '..', 'public', 'dictionary');
const FAILED_WORDS_FILE = path.join(require('os').tmpdir(), 'scheduly-modern-dictionary-failed.json');
const WORDS = `app applet analytics augmented-reality automation blockchain chatbot clickbait cloud-computing content-creator cryptocurrency cybersecurity dashboard data-driven deepfake decentralization digital-footprint digital-nomad disinformation doomscrolling e-commerce edtech emoji fintech gig-economy hacker hashtag livestream machine-learning metaverse misinformation mocktail nanotechnology podcast ransomware remote-work search-engine selfie smart-home smartphone smartwatch social-media software-as-a-service streaming subreddit telehealth three-dimensional tiktok tokenization touchless two-factor-authentication user-generated viral wearable wifi work-from-home zero-trust adaptability asynchronous bandwidth benchmark bioeconomy biometrics carbon-neutral circular-economy climate-action climate-resilient decarbonization electrification emissions-free energy-efficient food-security greenwashing microplastic net-zero reforestation renewable-energy upcycling agile brainstorming coworking freelancer freelancing hybrid-work incubator onboarding productivity reskilling skillset stakeholder startup side-hustle teamwork upskill work-life-balance antibiotic-resistant biohacking bioprinting biosensor contactless telemedicine immunotherapy microbiome mRNA personalized-medicine precision-medicine probiotics wearable-technology activism allyship body-positivity cancel-culture crowdsourcing fact-checking inclusivity intersectionality mindfulness neurodiversity paywall plant-based representation sustainability accountability actionable best-practice bottleneck buy-in scalability transparency user-friendly altcoin bitcoin cloud-native coders content-moderator creator-economy edge-computing green-tech healthtech insurtech proptech regtech tech-savvy web3 back-end frontend full-stack open-source plug-in push-notification responsive-design screenshot troubleshoot biosecurity carbon-capture carbon-footprint compostable conservation drought-resistant eco-friendly geothermal heatwave ocean-acidification solar-powered sustainable-development water-scarcity anti-vaxxer clickbaiter influencer internet-of-things microlearning newsletter livestreamer podcaster scammer troll videoconference`.split(/\s+/);

function loadShards() {
  const shards = {};
  const existing = new Set();
  for (const file of fs.readdirSync(DICTIONARY_DIR).filter((name) => name.endsWith('.json.br'))) {
    const data = JSON.parse(zlib.brotliDecompressSync(fs.readFileSync(path.join(DICTIONARY_DIR, file))));
    shards[file] = data;
    Object.keys(data).forEach((word) => existing.add(word.toLowerCase()));
  }
  return { shards, existing };
}

async function fetchDefinition(word) {
  let entries = null;
  try {
    const response = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`, {
      signal: AbortSignal.timeout(1500),
      headers: { accept: 'application/json' },
    });
    if (response.ok) {
      const data = await response.json();
      entries = [{ meanings: (data.en || []).map((part) => ({
        definitions: (part.definitions || []).map((item) => ({ definition: item.definition })),
      })) }];
    }
  } catch {
    entries = null;
  }
  if (!entries) {
    const fallback = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!fallback.ok) return null;
    entries = await fallback.json();
  }
  const definitions = [];
  for (const entry of entries) {
    for (const meaning of entry.meanings || []) {
      for (const definition of meaning.definitions || []) {
        if (definition.definition && !definitions.includes(definition.definition)) {
          definitions.push(definition.definition);
        }
      }
    }
  }
  return definitions.length ? definitions.slice(0, 12).join(' ') : null;
}

(async () => {
  const { shards, existing } = loadShards();
  let failedWords = [];
  try { failedWords = JSON.parse(fs.readFileSync(FAILED_WORDS_FILE, 'utf8')); } catch {}
  const failed = new Set(failedWords);
  const word = [...new Set(WORDS)].find((candidate) => !existing.has(candidate) && !failed.has(candidate));
  if (!word) {
    console.log('DONE: all requested words are already present or processed.');
    return;
  }

  try {
    const definition = await fetchDefinition(word);
    if (!definition) {
      fs.writeFileSync(FAILED_WORDS_FILE, JSON.stringify([...failed, word]));
      console.log(`SKIP: ${word} (no definition returned)`);
      return;
    }
    const file = `en-${word[0]}.json.br`;
    shards[file][word] = definition;
    const sorted = Object.fromEntries(Object.entries(shards[file]).sort(([a], [b]) => a.localeCompare(b)));
    fs.writeFileSync(path.join(DICTIONARY_DIR, file), zlib.brotliCompressSync(Buffer.from(JSON.stringify(sorted))));
    console.log(`ADDED: ${word} -> ${file}`);
  } catch (error) {
    fs.writeFileSync(FAILED_WORDS_FILE, JSON.stringify([...failed, word]));
    console.log(`SKIP: ${word} (${error.name === 'TimeoutError' ? 'timeout' : error.message})`);
  }
})();
