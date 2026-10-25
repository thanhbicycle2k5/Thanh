import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const target = resolve('src/data/openTriviaQuestions.ts');
const targetCount = Number(process.argv[2] ?? 1000);
const batchSize = 50;
const minimumRequestIntervalMs = 5200;
const categoryNames = new Map([
  [9, 'General Knowledge'],
  [10, 'Entertainment: Books'],
  [11, 'Entertainment: Film'],
  [12, 'Entertainment: Music'],
  [13, 'Entertainment: Musicals & Theatres'],
  [14, 'Entertainment: Television'],
  [15, 'Entertainment: Video Games'],
  [16, 'Entertainment: Board Games'],
  [17, 'Science & Nature'],
  [18, 'Science: Computers'],
  [19, 'Science: Mathematics'],
  [20, 'Mythology'],
  [21, 'Sports'],
  [22, 'Geography'],
  [23, 'History'],
  [24, 'Politics'],
  [25, 'Art'],
  [26, 'Celebrities'],
  [27, 'Animals'],
  [28, 'Vehicles'],
  [29, 'Entertainment: Comics'],
  [30, 'Science: Gadgets'],
  [31, 'Entertainment: Japanese Anime & Manga'],
  [32, 'Entertainment: Cartoon & Animations'],
]);
const categoryTopics = new Map([
  ['General Knowledge', 'general'],
  ['Entertainment: Books', 'culture'],
  ['Entertainment: Film', 'culture'],
  ['Entertainment: Music', 'culture'],
  ['Entertainment: Musicals & Theatres', 'culture'],
  ['Entertainment: Television', 'culture'],
  ['Entertainment: Video Games', 'culture'],
  ['Entertainment: Board Games', 'culture'],
  ['Entertainment: Comics', 'culture'],
  ['Entertainment: Japanese Anime & Manga', 'culture'],
  ['Entertainment: Cartoon & Animations', 'culture'],
  ['Science & Nature', 'science'],
  ['Science: Computers', 'science'],
  ['Science: Mathematics', 'science'],
  ['Science: Gadgets', 'science'],
  ['Mythology', 'culture'],
  ['Sports', 'sports'],
  ['Geography', 'geography'],
  ['History', 'history'],
  ['Politics', 'history'],
  ['Art', 'culture'],
  ['Celebrities', 'culture'],
  ['Animals', 'nature'],
  ['Vehicles', 'general'],
]);

const entities = new Map([
  ['amp', '&'], ['quot', '"'], ['apos', "'"], ['#039', "'"], ['lt', '<'], ['gt', '>'],
  ['nbsp', ' '], ['ndash', '–'], ['mdash', '—'], ['hellip', '…'], ['rsquo', '’'],
  ['lsquo', '‘'], ['rdquo', '”'], ['ldquo', '“'], ['eacute', 'é'], ['Eacute', 'É'],
  ['aacute', 'á'], ['Aacute', 'Á'], ['iacute', 'í'], ['Iacute', 'Í'], ['oacute', 'ó'],
  ['Oacute', 'Ó'], ['uacute', 'ú'], ['Uacute', 'Ú'], ['ntilde', 'ñ'], ['uuml', 'ü'],
  ['ouml', 'ö'], ['auml', 'ä'], ['aring', 'å'], ['ccedil', 'ç'], ['trade', '™'],
  ['reg', '®'], ['copy', '©'], ['euro', '€'], ['pound', '£'], ['deg', '°'],
]);

function decode(value) {
  return decodeURIComponent(value.replace(/\+/g, '%20')).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name) => {
    if (name[0] === '#') {
      const codePoint = name[1]?.toLowerCase() === 'x' ? Number.parseInt(name.slice(2), 16) : Number.parseInt(name.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }
    return entities.get(name) ?? entity;
  });
}

function topicFor(category) {
  const topic = categoryTopics.get(category);
  if (!topic) throw new Error(`Unmapped OpenTDB category: ${category}`);
  return topic;
}

function normalizeQuestion(result) {
  const question = decode(result.question).trim();
  const correctAnswer = decode(result.correct_answer).trim();
  const incorrectAnswers = result.incorrect_answers.map(decode).map((answer) => answer.trim());
  const answers = [...incorrectAnswers, correctAnswer];
  if (!question || answers.length !== 4 || new Set(answers.map((answer) => answer.toLocaleLowerCase())).size !== 4) return null;
  const id = createHash('sha256').update(question.toLocaleLowerCase()).digest('hex').slice(0, 20);
  return {
    id: `opentdb-${id}`,
    topic: topicFor(decode(result.category)),
    question: { vi: question, en: question },
    answers: { vi: answers, en: answers },
    correctIndex: 3,
    explanation: { vi: '', en: '' },
    source: { label: 'Open Trivia Database (CC BY-SA 4.0)', url: 'https://opentdb.com/' },
    questionLanguage: 'en',
  };
}

async function getJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'Task2GoalOfflineQuiz/1.0' } });
  if (!response.ok) throw new Error(`OpenTDB request failed (${response.status} ${response.statusText}).`);
  return response.json();
}

function allocateCategoryQuotas(questionCount, availableCounts) {
  const quotas = new Map();
  let remaining = questionCount;
  for (const id of categoryNames.keys()) {
    const allocation = Math.min(20, availableCounts.get(id), remaining);
    if (allocation > 0) {
      quotas.set(id, allocation);
      remaining -= allocation;
    }
  }

  if (remaining > 0 && [...categoryNames.keys()].reduce((total, id) => total + Math.min(batchSize, availableCounts.get(id)), 0) < questionCount) {
    throw new Error(`OpenTDB has not reported enough category questions to build a ${questionCount}-question pack.`);
  }
  return quotas;
}

async function main() {
  if (!Number.isInteger(targetCount) || targetCount < 1) throw new Error('Question count must be a positive integer.');
  const globalCounts = await getJson('https://opentdb.com/api_count_global.php');
  const verifiedCounts = new Map([...categoryNames.keys()].map((id) => [
    id,
    globalCounts.categories?.[id]?.total_num_of_verified_questions ?? 0,
  ]));
  const quotas = allocateCategoryQuotas(targetCount, verifiedCounts);
  await new Promise((resolveDelay) => setTimeout(resolveDelay, minimumRequestIntervalMs));
  const tokenResult = await getJson('https://opentdb.com/api_token.php?command=request');
  if (tokenResult.response_code !== 0 || !tokenResult.token) throw new Error(`OpenTDB token request failed (code ${tokenResult.response_code}).`);

  const collected = new Map();
  let lastRequestAt = Date.now();
  for (const [categoryId, amount] of quotas) {
    if (!amount) continue;
    const elapsed = Date.now() - lastRequestAt;
    const delay = minimumRequestIntervalMs - elapsed;
    if (lastRequestAt && delay > 0) await new Promise((resolveDelay) => setTimeout(resolveDelay, delay));
    const url = `https://opentdb.com/api.php?amount=${amount}&category=${categoryId}&type=multiple&encode=url3986&token=${encodeURIComponent(tokenResult.token)}`;
    const payload = await getJson(url);
    lastRequestAt = Date.now();
    if (payload.response_code !== 0) throw new Error(`OpenTDB question request failed (code ${payload.response_code}).`);
    for (const result of payload.results) {
      const question = normalizeQuestion(result);
      if (question) collected.set(question.id, question);
    }
    console.log(`Downloaded ${collected.size}/${targetCount} unique questions (${categoryNames.get(categoryId)}).`);
  }

  while (collected.size < targetCount) {
    const elapsed = Date.now() - lastRequestAt;
    const delay = minimumRequestIntervalMs - elapsed;
    if (delay > 0) await new Promise((resolveDelay) => setTimeout(resolveDelay, delay));
    const amount = Math.min(batchSize, targetCount - collected.size);
    const url = `https://opentdb.com/api.php?amount=${amount}&type=multiple&encode=url3986&token=${encodeURIComponent(tokenResult.token)}`;
    const payload = await getJson(url);
    lastRequestAt = Date.now();
    if (payload.response_code !== 0) throw new Error(`OpenTDB fill request failed (code ${payload.response_code}).`);
    for (const result of payload.results) {
      const question = normalizeQuestion(result);
      if (question) collected.set(question.id, question);
    }
    if (!payload.results.length) throw new Error('OpenTDB returned no additional unique questions.');
    console.log(`Filled ${collected.size}/${targetCount} unique questions.`);
  }

  const questions = [...collected.values()].slice(0, targetCount);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `import type { QuizQuestion } from './quizQuestions';\n\nexport const OPEN_TRIVIA_QUESTIONS: QuizQuestion[] = ${JSON.stringify(questions)};\n`, 'utf8');
  console.log(`Wrote ${questions.length} English questions to ${target}`);
}

main().catch((error) => {
  console.error('Could not generate the OpenTDB question pack:', error);
  process.exitCode = 1;
});
