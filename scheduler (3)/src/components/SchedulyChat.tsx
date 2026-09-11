import * as React from 'react';
import { ArrowUp, Check, Clipboard, Loader2, RefreshCw, Sparkles, Square, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DynamicCat } from './DynamicCat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { AIProvider, CatColor, CatMood, Plan, Theme } from '../types';
import { formatAIUserError, isDictionaryLookupQuery, isShortVocabularyQuery, normalizeHistory, type ChatTurn } from '../lib/aiRequest';
import { lookupLocalDictionary } from '../lib/localDictionary';
import { lookupOpenDictionary } from '../lib/openDictionary';
import { checkLocalAI, LocalAIError, requestLocalAI } from '../services/localAI';

interface SchedulyChatProps {
  open: boolean;
  onClose: () => void;
  theme: Theme;
  catColor: CatColor;
  plans: Plan[];
  aiProvider: AIProvider;
}

interface ChatMessage extends ChatTurn {
  id: string;
  source?: 'Local Dictionary' | 'Local AI' | 'Gemini';
}

const CHAT_CACHE_KEY = 'scheduly-ai-cache';
const MAX_CACHE_ITEMS = 30;

function readAnswerCache(): Record<string, { text: string; source: ChatMessage['source'] }> {
  try {
    const parsed = JSON.parse(localStorage.getItem(CHAT_CACHE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function cacheAnswer(question: string, answer: { text: string; source: ChatMessage['source'] }) {
  try {
    const cache = readAnswerCache();
    cache[question.trim().toLowerCase()] = answer;
    const entries = Object.entries(cache).slice(-MAX_CACHE_ITEMS);
    localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Cache is optional and must never interrupt chat.
  }
}

function SchedulyAnswer({ text }: { text: string }) {
  return (
    <div className="scheduly-answer text-sm leading-7">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          h1: ({ children }) => <h3 className="mb-2 text-base font-bold">{children}</h3>,
          h2: ({ children }) => <h3 className="mb-2 text-base font-bold">{children}</h3>,
          h3: ({ children }) => <h3 className="mb-2 text-base font-bold text-[#107C41] dark:text-[#6ee7a5]">{children}</h3>,
          blockquote: ({ children }) => <blockquote className="my-3 border-l-2 border-[#107C41]/40 pl-3 italic opacity-80">{children}</blockquote>,
          code: ({ children, className }) => <code className={cn('rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em]', className?.includes('language-') && 'block whitespace-pre-wrap p-3')}>{children}</code>,
          a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="font-medium text-[#107C41] underline underline-offset-2">{children}</a>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

function getRelevantTaskContext(question: string, plans: Plan[]) {
  const today = new Date().toISOString().slice(0, 10);
  const lowerQuestion = question.toLowerCase();
  const asksAboutToday = lowerQuestion.includes('today') || lowerQuestion.includes('hôm nay');
  const relevantPlans = asksAboutToday ? plans.filter((plan) => plan.date === today) : plans;

  return relevantPlans
    .slice()
    .sort((left, right) => `${left.date}-${left.startHour}-${left.startMinute ?? 0}`.localeCompare(`${right.date}-${right.startHour}-${right.startMinute ?? 0}`))
    .slice(0, 12)
    .map((plan) => ({
      title: plan.title,
      date: plan.date,
      startHour: plan.startHour,
      startMinute: plan.startMinute,
      duration: plan.duration,
      completed: plan.color === 'green',
    }));
}

function getLocalTaskAnswer(question: string, plans: Plan[]) {
  const lowerQuestion = question.toLowerCase();
  const today = new Date().toISOString().slice(0, 10);
  const todayPlans = plans.filter((plan) => plan.date === today);
  const unfinishedPlans = plans.filter((plan) => plan.color !== 'green');
  const asksToday = lowerQuestion.includes('today') || lowerQuestion.includes('hôm nay');
  const asksUnfinished = lowerQuestion.includes('unfinished') || lowerQuestion.includes('chưa hoàn thành') || lowerQuestion.includes('chưa xong');

  if (asksToday && (lowerQuestion.includes('task') || lowerQuestion.includes('schedule') || lowerQuestion.includes('việc'))) {
    if (todayPlans.length === 0) return 'You have no tasks scheduled for today.';
    return `**Today's tasks**\n\n${todayPlans.map((plan) => `- **${plan.title}** (${String(plan.startHour).padStart(2, '0')}:${String(plan.startMinute ?? 0).padStart(2, '0')})`).join('\n')}`;
  }
  if (asksUnfinished && (lowerQuestion.includes('how many') || lowerQuestion.includes('bao nhiêu') || lowerQuestion.includes('count'))) {
    return `You have **${unfinishedPlans.length} unfinished task${unfinishedPlans.length === 1 ? '' : 's'}**.`;
  }
  return null;
}

export function SchedulyChat({ open, onClose, theme, catColor, plans, aiProvider }: SchedulyChatProps) {
  const [question, setQuestion] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copiedMessageId, setCopiedMessageId] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesRef = React.useRef<HTMLDivElement>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  React.useEffect(() => {
    const container = messagesRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, isLoading]);

  React.useEffect(() => () => abortControllerRef.current?.abort(), []);

  const updateAssistant = React.useCallback((id: string, patch: Partial<ChatMessage>) => {
    setMessages((current) => current.map((message) => message.id === id ? { ...message, ...patch } : message));
  }, []);

  const fallbackToGemini = async (trimmedQuestion: string, priorHistory: ChatTurn[], assistantMessageId: string) => {
    const response = await fetch('/api/scheduly-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: trimmedQuestion,
        history: priorHistory,
        taskContext: getRelevantTaskContext(trimmedQuestion, plans),
      }),
      signal: abortControllerRef.current?.signal,
    });
    const payload = await response.json().catch(() => null) as { answer?: string; error?: string } | null;
    if (!response.ok) throw new Error(payload?.error || 'Gemini fallback is unavailable.');
    if (!payload?.answer) throw new Error('Gemini fallback is unavailable.');
    updateAssistant(assistantMessageId, { text: payload.answer, source: 'Gemini' });
    cacheAnswer(trimmedQuestion, { text: payload.answer, source: 'Gemini' });
  };

  const submitQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isLoading) return;

    const priorHistory = isShortVocabularyQuery(trimmedQuestion)
      ? []
      : normalizeHistory(messages.map(({ role, text }) => ({ role, text })));
    const userMessage: ChatMessage = { id: `${Date.now()}-user`, role: 'user', text: trimmedQuestion };
    const assistantMessage: ChatMessage = { id: `${Date.now()}-assistant`, role: 'assistant', text: '' };
    setQuestion('');
    setError('');
    setMessages((current) => [...current, userMessage, assistantMessage]);
    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const cachedAnswer = isShortVocabularyQuery(trimmedQuestion)
        ? readAnswerCache()[trimmedQuestion.toLowerCase()]
        : undefined;
      if (cachedAnswer) {
        updateAssistant(assistantMessage.id, { text: cachedAnswer.text, source: cachedAnswer.source });
        return;
      }

      const localDictionaryAnswer = lookupLocalDictionary(trimmedQuestion);
      const openDictionaryAnswer = !localDictionaryAnswer && isDictionaryLookupQuery(trimmedQuestion)
        ? await lookupOpenDictionary(trimmedQuestion)
        : null;
      const localTaskAnswer = getLocalTaskAnswer(trimmedQuestion, plans);

      if (localDictionaryAnswer || openDictionaryAnswer || localTaskAnswer) {
        const answer = localDictionaryAnswer || openDictionaryAnswer || localTaskAnswer || '';
        updateAssistant(assistantMessage.id, { text: answer, source: 'Local Dictionary' });
        cacheAnswer(trimmedQuestion, { text: answer, source: 'Local Dictionary' });
        return;
      }

      if (aiProvider !== 'gemini') {
        try {
          let streamedAnswer = '';
          const answer = await requestLocalAI({
            question: trimmedQuestion,
            history: priorHistory,
            signal: abortControllerRef.current.signal,
            onToken: (token) => {
              streamedAnswer += token;
              updateAssistant(assistantMessage.id, { text: streamedAnswer, source: 'Local AI' });
            },
          });
          updateAssistant(assistantMessage.id, { text: answer, source: 'Local AI' });
          cacheAnswer(trimmedQuestion, { text: answer, source: 'Local AI' });
          return;
        } catch (localError) {
          if (localError instanceof LocalAIError && localError.code === 'ABORTED') throw localError;
          if (aiProvider === 'local') throw localError;
        }
      }

      await fallbackToGemini(trimmedQuestion, priorHistory, assistantMessage.id);
    } catch (requestError) {
      if (requestError instanceof LocalAIError && requestError.code === 'ABORTED') {
        updateAssistant(assistantMessage.id, { text: 'Generation stopped.', source: 'Local AI' });
      } else {
        setMessages((current) => current.filter((message) => message.id !== assistantMessage.id));
      }
      setError(formatAIUserError(requestError));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => abortControllerRef.current?.abort();
  const clearChat = () => {
    if (isLoading) stopGeneration();
    setMessages([]);
    setError('');
  };

  const copyMessage = async (message: ChatMessage) => {
    await navigator.clipboard.writeText(message.text);
    setCopiedMessageId(message.id);
    window.setTimeout(() => setCopiedMessageId(null), 1500);
  };

  if (!open) return null;

  const suggestions = [
    { label: 'Plan my day', icon: '✨' },
    { label: 'Help me with English', icon: '📚' },
    { label: 'Explain a word', icon: '🇬🇧' },
    { label: 'Organize my tasks', icon: '🎯' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-2 backdrop-blur-[3px] sm:p-6" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section role="dialog" aria-modal="true" aria-labelledby="scheduly-chat-title" className={cn(
        'flex h-[min(720px,calc(100vh-1rem))] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border shadow-2xl sm:h-[min(720px,calc(100vh-3rem))]',
        theme === 'dark' ? 'border-white/10 bg-[#17201b] text-white' : 'border-[#107C41]/15 bg-white text-slate-900'
      )}>
        <header className="flex items-center justify-between border-b border-white/15 bg-[#107C41] px-4 py-3.5 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <DynamicCat mood={'happy' as CatMood} color={catColor} size="sm" className="h-11 w-11 shrink-0" />
            <div className="min-w-0">
              <h2 id="scheduly-chat-title" className="truncate text-base font-black">Scheduly AI</h2>
              <p className="truncate text-xs text-white/80">Your personal AI assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" aria-label="Clear chat" onClick={clearChat} className="text-white hover:bg-white/15 hover:text-white"><RefreshCw className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Close Scheduly AI" onClick={onClose} className="shrink-0 text-white hover:bg-white/15 hover:text-white"><X className="h-5 w-5" /></Button>
          </div>
        </header>

        <div ref={messagesRef} className="flex-1 space-y-6 overflow-y-auto bg-gradient-to-b from-[#107C41]/[0.035] to-transparent p-4 sm:p-8">
          {messages.length === 0 && (
            <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center pb-8 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#107C41]/10 text-[#107C41] dark:bg-[#6ee7a5]/10 dark:text-[#6ee7a5]"><Sparkles className="h-7 w-7" /></div>
              <p className="text-2xl font-black tracking-tight sm:text-3xl">How can I help you today?</p>
              <p className="mt-3 max-w-md text-sm leading-6 opacity-60">Ask Scheduly AI about your tasks, study, English, planning, or your day.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion) => <button key={suggestion.label} type="button" onClick={() => setQuestion(suggestion.label)} className="rounded-full border border-current/10 bg-background/70 px-3.5 py-2 text-xs font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-[#107C41]/35 hover:text-[#107C41]"><span aria-hidden="true" className="mr-1.5">{suggestion.icon}</span>{suggestion.label}</button>)}
              </div>
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className={cn('flex gap-2.5', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              {message.role === 'assistant' && <DynamicCat mood={'happy' as CatMood} color={catColor} size="sm" className="mt-1 h-7 w-7 shrink-0" />}
              <div className={cn('max-w-[88%]', message.role === 'user' && 'rounded-2xl rounded-br-md bg-[#107C41] px-4 py-3 text-white shadow-sm')}>
                {message.role === 'assistant' ? <><SchedulyAnswer text={message.text} />{message.text && <div className="mt-2 flex items-center gap-2 text-[10px] opacity-60"><span className="rounded-full border border-current/15 px-2 py-0.5">{message.source || 'Local AI'}</span><button type="button" onClick={() => void copyMessage(message)} className="inline-flex items-center gap-1 hover:opacity-100" aria-label="Copy response">{copiedMessageId === message.id ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}{copiedMessageId === message.id ? 'Copied' : 'Copy'}</button></div>}</> : <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>}
              </div>
            </div>
          ))}
          {isLoading && <div className="flex items-center gap-2 pl-10 text-sm opacity-65"><Loader2 className="h-4 w-4 animate-spin" /> Scheduly AI is thinking...</div>}
          {error && <p role="alert" className="rounded-xl border border-red-300/50 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
        </div>

        <form onSubmit={submitQuestion} className="border-t border-current/10 bg-background/80 p-3 sm:p-4">
          <div className="flex items-end gap-2 rounded-[22px] border border-current/15 bg-muted/40 p-2 shadow-sm transition focus-within:border-[#107C41]/45 focus-within:ring-2 focus-within:ring-[#107C41]/15">
            <Textarea ref={inputRef} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Ask Scheduly AI anything..." aria-label="Message Scheduly AI" rows={2} className="min-h-12 resize-none border-0 bg-transparent px-3 py-2 shadow-none focus-visible:ring-0" disabled={isLoading} />
            {isLoading ? <Button type="button" size="icon" aria-label="Stop generation" onClick={stopGeneration} className="mb-0.5 shrink-0 rounded-full bg-red-600 text-white hover:bg-red-700"><Square className="h-4 w-4" /></Button> : <Button type="submit" size="icon" aria-label="Send message" disabled={!question.trim()} className="mb-0.5 shrink-0 rounded-full bg-[#107C41] text-white hover:bg-[#0c6334]"><ArrowUp className="h-5 w-5" /></Button>}
          </div>
          <p className="mt-2 text-center text-[10px] opacity-45">Enter to send · Shift + Enter for a new line</p>
        </form>
      </section>
    </div>
  );
}
