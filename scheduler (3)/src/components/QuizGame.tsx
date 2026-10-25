import * as React from 'react';
import { ArrowLeft, Check, Clock3, Copy, Gamepad2, Share2, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { toBlob } from 'html-to-image';
import { toast } from 'sonner';
import type { CatColor, Language } from '../types';
import { QUIZ_QUESTIONS, QUIZ_TOPICS, type QuizQuestion, type QuizTopic } from '../data/quizQuestions';
import { getCatImage } from './DynamicCat';

type QuizChoice = { text: string; correct: boolean };
type QuizStage = 'welcome' | 'playing' | 'result';

const ROUND_SIZE = 10;
const ROUND_SECONDS = 15;
const HISTORY_KEY = 'task2goal_quiz_seen_v1';
const HIGH_SCORE_KEY = 'task2goal_quiz_high_score_v1';
const copy = {
  vi: {
    title: 'Đố vui thế giới',
    subtitle: 'Thử thách kiến thức, mèo cổ vũ hết mình!',
    start: 'Bắt đầu chơi',
    chooseTopic: 'Chọn chủ đề',
    all: 'Tất cả chủ đề',
    topics: { science: 'Khoa học', geography: 'Địa lý', history: 'Lịch sử', space: 'Vũ trụ', nature: 'Thiên nhiên', culture: 'Văn hóa', sports: 'Thể thao', general: 'Tổng hợp' } satisfies Record<QuizTopic, string>,
    questionLanguage: 'Ngôn ngữ câu hỏi',
    vietnamesePack: 'Tiếng Việt · 1.024 câu',
    englishPack: 'English · 1.000 câu',
    loadingPack: 'Đang nạp ngân hàng câu hỏi...',
    packLoadError: 'Không nạp được ngân hàng tiếng Anh. Hãy thử lại khi kết nối ổn định.',
    attribution: 'Ngân hàng tiếng Anh từ Open Trivia Database, giấy phép CC BY-SA 4.0. Nội dung cần được chia sẻ theo cùng giấy phép.',
    offline: 'Chơi offline · 15 giây mỗi câu · tối đa 10 câu mỗi lượt',
    question: 'Câu',
    of: '/',
    points: 'điểm',
    seconds: 'giây',
    next: 'Câu tiếp theo',
    finish: 'Xem kết quả',
    correct: ['Tuyệt vời! Bạn giỏi quá!', 'Chính xác! Mèo tin bạn mà!', 'Quá đỉnh! Tiếp tục nhé!', 'Hoan hô! Bạn biết tuốt!'],
    wrong: 'Chưa đúng lần này, mình cùng học nhé!',
    timeout: 'Hết giờ mất rồi! Cùng xem đáp án nhé.',
    explanation: 'Bạn có biết?',
    resultTitle: 'Bạn đã hoàn thành!',
    resultSubtitle: 'Mỗi câu trả lời đều giúp bạn biết thêm điều mới.',
    rightAnswers: 'câu đúng',
    best: 'Kỷ lục của bạn',
    playAgain: 'Chơi lượt mới',
    back: 'Quay lại',
    share: 'Chia sẻ kết quả',
    shareTitle: 'Kết quả Đố vui thế giới',
    copied: 'Đã sao chép ảnh kết quả!',
    saved: 'Đã tải ảnh kết quả xuống.',
    shareError: 'Không thể tạo ảnh chia sẻ. Vui lòng thử lại.',
    source: 'Nguồn tham khảo',
    close: 'Đóng trò chơi',
    loadingShare: 'Đang tạo ảnh...',
    questionBank: 'Bộ câu hỏi Open Trivia Database đã dịch sang tiếng Việt và có ghi nguồn.',
  },
  en: {
    title: 'World Quiz',
    subtitle: 'Test your knowledge while your cat cheers you on!',
    start: 'Start playing',
    chooseTopic: 'Choose a topic',
    all: 'All topics',
    topics: { science: 'Science', geography: 'Geography', history: 'History', space: 'Space', nature: 'Nature', culture: 'Culture', sports: 'Sports', general: 'General' } satisfies Record<QuizTopic, string>,
    questionLanguage: 'Question language',
    vietnamesePack: 'Vietnamese · 1,024 questions',
    englishPack: 'English · 1,024 questions',
    loadingPack: 'Loading question bank...',
    packLoadError: 'Could not load the English question bank. Try again when your connection is stable.',
    attribution: 'English question bank from Open Trivia Database, licensed CC BY-SA 4.0. Adaptations must be shared under the same license.',
    offline: 'Works offline · 15 seconds per question · up to 10 questions per round',
    question: 'Question',
    of: '/',
    points: 'points',
    seconds: 'seconds',
    next: 'Next question',
    finish: 'See results',
    correct: ['Brilliant! You got it!', 'That’s right! Your cat knew you could do it!', 'Amazing answer! Keep it up!', 'Hooray! You know your stuff!'],
    wrong: 'Not quite this time. Let’s learn together!',
    timeout: 'Time is up! Let’s check the answer.',
    explanation: 'Did you know?',
    resultTitle: 'Round complete!',
    resultSubtitle: 'Every answer is a chance to learn something new.',
    rightAnswers: 'correct answers',
    best: 'Your best score',
    playAgain: 'Play another round',
    back: 'Go back',
    share: 'Share result',
    shareTitle: 'World Quiz result',
    copied: 'Result image copied!',
    saved: 'Result image downloaded.',
    shareError: 'Could not create the result image. Please try again.',
    source: 'Reference',
    close: 'Close game',
    loadingShare: 'Creating image...',
    questionBank: 'Open Trivia Database question pack translated into Vietnamese with attribution.',
  },
} as const;

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

function readSeenQuestions(): string[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch (error) {
    console.warn('Quiz history could not be read:', error);
    return [];
  }
}

function saveSeenQuestions(ids: string[]) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify([...new Set(ids)].slice(-1024)));
  } catch (error) {
    console.warn('Quiz history could not be saved:', error);
  }
}

function readHighScore(): number {
  try {
    const value = Number(window.localStorage.getItem(HIGH_SCORE_KEY) ?? 0);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch (error) {
    console.warn('Quiz high score could not be read:', error);
    return 0;
  }
}

function saveHighScore(score: number) {
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch (error) {
    console.warn('Quiz high score could not be saved:', error);
  }
}

function playCorrectSound() {
  try {
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return;
    const context = new AudioContextConstructor();
    const now = context.currentTime;
    [659.25, 783.99, 1046.5].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.09;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.26);
    });
    window.setTimeout(() => void context.close(), 700);
  } catch (error) {
    console.warn('Quiz celebration sound could not play:', error);
  }
}

function chooseRound(topic: QuizTopic | 'all', questionBank: QuizQuestion[]): QuizQuestion[] {
  const pool = questionBank.filter((question) => topic === 'all' || question.topic === topic);
  const size = Math.min(ROUND_SIZE, pool.length);
  const seen = new Set(readSeenQuestions());
  let fresh = shuffle(pool.filter((question) => !seen.has(question.id)));

  if (fresh.length < size) {
    const usedThisRound = new Set(fresh.map((question) => question.id));
    fresh = [...fresh, ...shuffle(pool.filter((question) => !usedThisRound.has(question.id)))];
  }

  return fresh.slice(0, size);
}

export function QuizGame({ language, catColor, onClose }: { language: Language; catColor: CatColor; onClose: () => void }) {
  const text = copy[language];
  const [stage, setStage] = React.useState<QuizStage>('welcome');
  const [topic, setTopic] = React.useState<QuizTopic | 'all'>('all');
  const [questionLanguage, setQuestionLanguage] = React.useState<Language>('vi');
  const [englishQuestions, setEnglishQuestions] = React.useState<QuizQuestion[] | null>(null);
  const [questionPackLoading, setQuestionPackLoading] = React.useState(false);
  const [questionPackError, setQuestionPackError] = React.useState(false);
  const [round, setRound] = React.useState<QuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [choices, setChoices] = React.useState<QuizChoice[]>([]);
  const [selectedChoice, setSelectedChoice] = React.useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = React.useState(ROUND_SECONDS);
  const [score, setScore] = React.useState(0);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [highScore, setHighScore] = React.useState(readHighScore);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [cheer, setCheer] = React.useState('');
  const [sharing, setSharing] = React.useState(false);
  const posterRef = React.useRef<HTMLDivElement>(null);
  const recordedQuestionsRef = React.useRef(new Set<string>());

  const currentQuestion = round[questionIndex];

  React.useEffect(() => {
    if (stage !== 'playing' || !currentQuestion || recordedQuestionsRef.current.has(currentQuestion.id)) return;
    recordedQuestionsRef.current.add(currentQuestion.id);
    saveSeenQuestions([...readSeenQuestions(), currentQuestion.id]);
  }, [currentQuestion, stage]);

  const loadEnglishQuestionPack = React.useCallback(async () => {
    setQuestionPackLoading(true);
    setQuestionPackError(false);
    try {
      const { OPEN_TRIVIA_QUESTIONS } = await import('../data/openTriviaQuestions');
      setEnglishQuestions(OPEN_TRIVIA_QUESTIONS);
    } catch (error) {
      console.error('English quiz question bank failed to load:', error);
      setQuestionPackError(true);
    } finally {
      setQuestionPackLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!englishQuestions && !questionPackError) {
      void loadEnglishQuestionPack();
    }
  }, [englishQuestions, loadEnglishQuestionPack, questionLanguage, questionPackError]);

  React.useEffect(() => {
    if (stage !== 'playing' || selectedChoice !== null || !currentQuestion) return;
    const deadline = Date.now() + ROUND_SECONDS * 1000;
    setSecondsLeft(ROUND_SECONDS);
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        window.clearInterval(interval);
        setSelectedChoice(-1);
        setCheer(text.timeout);
      }
    }, 150);
    return () => window.clearInterval(interval);
  }, [currentQuestion, selectedChoice, stage, text.timeout]);

  React.useEffect(() => {
    if (!currentQuestion) return;
    const correctAnswer = currentQuestion.answers[questionLanguage][currentQuestion.correctIndex];
    const options = currentQuestion.answers[questionLanguage].map((answer) => ({ text: answer, correct: answer === correctAnswer }));
    setChoices(shuffle(options));
  }, [currentQuestion, questionLanguage]);

  React.useEffect(() => {
    if (stage !== 'result') return;
    const best = Math.max(highScore, score);
    if (best > highScore) {
      saveHighScore(best);
      setHighScore(best);
    }
  }, [highScore, score, stage]);

  const questionBank = React.useMemo(
    () => [...QUIZ_QUESTIONS, ...(englishQuestions ?? [])],
    [englishQuestions],
  );
  const availableTopics = React.useMemo(
    () => QUIZ_TOPICS.filter((availableTopic) => questionBank.some((question) => question.topic === availableTopic)),
    [questionBank],
  );

  const startRound = () => {
    const selectedTopic = topic === 'all' || availableTopics.includes(topic) ? topic : 'all';
    const questions = chooseRound(selectedTopic, questionBank);
    setRound(questions);
    setQuestionIndex(0);
    setScore(0);
    setCorrectCount(0);
    setSelectedChoice(null);
    setCheer('');
    setStage('playing');
  };

  const answerQuestion = (choiceIndex: number) => {
    if (selectedChoice !== null || !currentQuestion) return;
    const choice = choices[choiceIndex];
    setSelectedChoice(choiceIndex);
    if (choice?.correct) {
      setScore((current) => current + 100 + secondsLeft * 10);
      setCorrectCount((current) => current + 1);
      setCheer(text.correct[Math.floor(Math.random() * text.correct.length)]);
      if (soundEnabled) playCorrectSound();
    } else {
      setCheer(choiceIndex === -1 ? text.timeout : text.wrong);
    }
  };

  const nextQuestion = () => {
    if (questionIndex + 1 >= round.length) {
      setStage('result');
      return;
    }
    setQuestionIndex((index) => index + 1);
    setSelectedChoice(null);
    setCheer('');
  };

  const shareResult = async () => {
    const poster = posterRef.current;
    if (!poster) {
      toast.error(text.shareError);
      return;
    }
    setSharing(true);
    try {
      const blob = await toBlob(poster, { pixelRatio: 2, cacheBust: true });
      if (!blob) throw new Error('Could not render quiz result image.');
      const file = new File([blob], 'world-quiz-result.png', { type: 'image/png' });
      if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: text.shareTitle, text: `${score} ${text.points} · ${correctCount}/${round.length}`, files: [file] });
      } else if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        toast.success(text.copied);
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'world-quiz-result.png';
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.success(text.saved);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Quiz result sharing failed:', error);
      toast.error(text.shareError);
    } finally {
      setSharing(false);
    }
  };

  const progress = stage === 'playing' && round.length ? ((questionIndex + 1) / round.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[120] flex flex-col overflow-y-auto bg-[#f7f8f3] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-emerald-100 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-8">
        <button type="button" onClick={stage === 'playing' ? () => setStage('welcome') : onClose} className="inline-flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          {stage === 'playing' ? <ArrowLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
          <span className="hidden sm:inline">{stage === 'playing' ? text.back : text.close}</span>
        </button>
        <div className="flex items-center gap-2 font-black tracking-tight">
          <Gamepad2 className="h-5 w-5 text-emerald-600" />
          <span>{text.title}</span>
        </div>
        <button type="button" onClick={() => setSoundEnabled((enabled) => !enabled)} className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label={soundEnabled ? 'Mute game sounds' : 'Enable game sounds'}>
          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
      </header>

      {stage === 'welcome' && (
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-8 sm:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid items-center gap-6 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 dark:from-emerald-950/40 dark:via-slate-900 dark:to-amber-950/20 sm:grid-cols-[1fr_220px] sm:p-10">
              <div>
                <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"><Sparkles className="h-4 w-4" /> {text.offline}</span>
                <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{text.title}</h1>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">{text.subtitle}</p>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {questionLanguage === 'vi' ? text.vietnamesePack : text.englishPack}
                </p>
              </div>
              <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full bg-white/70 p-3 shadow-inner dark:bg-slate-800/70 sm:h-52 sm:w-52">
                <img src={getCatImage(catColor)} alt="Your cat mascot" className="h-full w-full object-contain" />
              </div>
            </div>
            <div className="space-y-5 p-6 sm:p-10">
              <div>
                <p className="mb-3 text-sm font-bold">{text.questionLanguage}</p>
                <div className="flex flex-wrap gap-2">
                  {(['vi', 'en'] as const).map((quizLanguage) => (
                    <button key={quizLanguage} type="button" onClick={() => setQuestionLanguage(quizLanguage)} aria-pressed={questionLanguage === quizLanguage} className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${questionLanguage === quizLanguage ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 hover:border-emerald-400 dark:border-slate-700'}`}>
                      {quizLanguage === 'vi' ? text.vietnamesePack : text.englishPack}
                    </button>
                  ))}
                </div>
                {questionLanguage === 'en' && (
                  <p className="mt-3 max-w-2xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {text.attribution}{' '}
                    <a href="https://opentdb.com/" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">Open Trivia Database</a>
                    {' · '}
                    <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">CC BY-SA 4.0</a>
                  </p>
                )}
              </div>
              <div>
                <p className="mb-3 text-sm font-bold">{text.chooseTopic}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setTopic('all')} className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${topic === 'all' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 hover:border-emerald-400 dark:border-slate-700'}`}>{text.all}</button>
                  {availableTopics.map((item) => (
                    <button key={item} type="button" onClick={() => setTopic(item)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${topic === item ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 hover:border-emerald-400 dark:border-slate-700'}`}>{text.topics[item]}</button>
                  ))}
                </div>
              </div>
              {questionPackLoading && <p role="status" className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{text.loadingPack}</p>}
              {questionPackError && (
                <div className="flex flex-wrap items-center gap-3 text-sm text-red-600" role="alert">
                  <span>{text.packLoadError}</span>
                  <button type="button" onClick={() => void loadEnglishQuestionPack()} className="font-bold underline underline-offset-2">{language === 'vi' ? 'Thử lại' : 'Retry'}</button>
                </div>
              )}
              <button type="button" disabled={!englishQuestions || questionPackLoading} onClick={startRound} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60 sm:w-auto">
                <Gamepad2 className="h-5 w-5" /> {text.start}
              </button>
            </div>
          </div>
        </main>
      )}

      {stage === 'playing' && currentQuestion && (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-5 sm:px-8 sm:py-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">{text.topics[currentQuestion.topic]}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">{text.question} {questionIndex + 1} {text.of} {round.length}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-bold text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-300">{score} {text.points}</span>
              <div className={`flex h-12 min-w-20 items-center justify-center gap-2 rounded-2xl border px-3 font-mono text-lg font-black ${secondsLeft <= 5 ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300' : 'border-emerald-100 bg-white text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-300'}`}>
                <Clock3 className="h-4 w-4" /> 00:{String(secondsLeft).padStart(2, '0')}
              </div>
            </div>
          </div>
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-emerald-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>

          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <h2 className="text-xl font-extrabold leading-snug sm:text-2xl">{currentQuestion.question[questionLanguage]}</h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {choices.map((choice, index) => {
                const isSelected = selectedChoice === index;
                const showCorrect = selectedChoice !== null && choice.correct;
                const showWrong = isSelected && !choice.correct;
                return (
                  <button key={`${currentQuestion.id}-${choice.text}`} type="button" disabled={selectedChoice !== null} onClick={() => answerQuestion(index)} className={`flex min-h-20 items-start gap-3 rounded-2xl border p-3 text-left text-sm font-semibold transition-all sm:min-h-24 sm:items-center sm:p-4 sm:text-base ${showCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-100' : showWrong ? 'border-red-400 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100' : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/60 disabled:cursor-default dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-black ${showCorrect ? 'bg-emerald-600 text-white' : showWrong ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{String.fromCharCode(65 + index)}</span>
                    <span className="pt-1 sm:pt-0">{choice.text}</span>
                    {showCorrect && <Check className="ml-auto h-5 w-5 shrink-0 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="my-5 flex items-center gap-4 rounded-2xl bg-emerald-50/80 p-3 dark:bg-emerald-950/30 sm:p-4">
            <img src={getCatImage(catColor)} alt="" className={`h-16 w-16 object-contain ${selectedChoice !== null && choices[selectedChoice]?.correct ? 'animate-bounce' : ''}`} />
            <div className="min-w-0">
              <p className="font-bold text-emerald-900 dark:text-emerald-100">{cheer || (language === 'vi' ? 'Mèo đang cổ vũ bạn nè!' : 'Your cat is cheering for you!')}</p>
              {selectedChoice !== null && (
                <>
                  {currentQuestion.explanation[questionLanguage] && <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{text.explanation} {currentQuestion.explanation[questionLanguage]}</p>}
                  <a href={currentQuestion.source.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-emerald-700 underline underline-offset-2 dark:text-emerald-300">{text.source}: {currentQuestion.source.label}</a>
                </>
              )}
            </div>
          </div>

          {selectedChoice !== null && (
            <button type="button" onClick={nextQuestion} className="mt-auto flex h-12 items-center justify-center rounded-2xl bg-emerald-600 px-6 font-bold text-white transition hover:bg-emerald-700">
              {questionIndex + 1 === round.length ? text.finish : text.next}
            </button>
          )}
        </main>
      )}

      {stage === 'result' && (
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-8 sm:px-8">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 text-center shadow-xl shadow-emerald-950/5 dark:border-slate-800 dark:bg-slate-900 sm:p-10">
            <img src={getCatImage(catColor)} alt="Your cat mascot" className="mx-auto h-32 w-32 object-contain" />
            <p className="mt-2 text-sm font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">{text.resultTitle}</p>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{text.resultSubtitle}</p>
            <p className="mt-6 text-6xl font-black tracking-tight text-emerald-700 dark:text-emerald-300">{score}</p>
            <p className="mt-1 font-bold text-slate-500">{text.points}</p>
            <p className="mt-4 text-sm font-semibold">{correctCount}/{round.length} {text.rightAnswers}</p>
            <p className="mt-1 text-xs text-slate-500">{text.best}: {Math.max(highScore, score)} {text.points}</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" disabled={sharing} onClick={() => void shareResult()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 px-5 font-bold text-emerald-800 hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-900 dark:text-emerald-200 dark:hover:bg-emerald-950/50">{sharing ? <Copy className="h-4 w-4 animate-pulse" /> : <Share2 className="h-4 w-4" />}{sharing ? text.loadingShare : text.share}</button>
              <button type="button" onClick={startRound} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-700"><Gamepad2 className="h-4 w-4" />{text.playAgain}</button>
            </div>
          </div>
          <div ref={posterRef} className="pointer-events-none fixed left-[-10000px] top-0 flex h-[420px] w-[720px] flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-12 text-center font-sans text-slate-900">
            <img src={getCatImage(catColor)} alt="" className="h-28 w-28 object-contain" />
            <p className="mt-3 text-2xl font-black text-emerald-800">{text.title}</p>
            <p className="mt-6 text-7xl font-black text-emerald-700">{score}</p>
            <p className="mt-2 text-xl font-bold">{correctCount}/{round.length} {text.rightAnswers}</p>
            <p className="mt-6 text-sm text-slate-500">Task2Goal · {text.resultTitle}</p>
          </div>
        </main>
      )}
    </div>
  );
}
