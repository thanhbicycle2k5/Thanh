import * as React from 'react';
import { ArrowUp, Loader2, Sparkles, X } from 'lucide-react';
import { DynamicCat } from './DynamicCat';
import { streamScheduly } from '../lib/schedulyChat';
import { formatGeminiUserError, isShortVocabularyQuery } from '../lib/geminiRequest';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CatColor, CatMood, Theme } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SchedulyChatProps {
  open: boolean;
  onClose: () => void;
  theme: Theme;
  catColor: CatColor;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const DICTIONARY_SECTIONS = /^(WORD|PRONUNCIATION|PART OF SPEECH|MEANING|COMMON MEANINGS|EXAMPLE|VIETNAMESE|COLLOCATIONS|USAGE|CEFR|LITERAL TRANSLATION|NATURAL TRANSLATION|PROFESSIONAL TRANSLATION):?$/i;

function prepareSchedulyMarkdown(text: string) {
  return text.split('\n').map((line) => {
    const section = line.trim().replace(/^\*\*(.+?)\*\*:?$/, '$1').trim();
    return DICTIONARY_SECTIONS.test(section) ? `### ${section}` : line;
  }).join('\n');
}

function SchedulyAnswer({ text }: { text: string }) {
  return (
    <div className="scheduly-answer text-sm leading-7">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          h3: ({ children }) => <h3 className="mt-5 mb-1.5 border-b border-[#107C41]/15 pb-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#107C41] first:mt-0 dark:text-[#6ee7a5]">{children}</h3>,
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => <blockquote className="my-3 border-l-2 border-[#107C41]/40 pl-3 italic opacity-80">{children}</blockquote>,
          code: ({ children, className }) => <code className={cn('rounded-md bg-background/70 px-1.5 py-0.5 font-mono text-[0.9em]', className?.includes('language-') && 'block whitespace-pre-wrap p-3')}>{children}</code>,
          a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="font-medium text-[#107C41] underline underline-offset-2">{children}</a>,
        }}
      >
        {prepareSchedulyMarkdown(text)}
      </ReactMarkdown>
    </div>
  );
}

export function SchedulyChat({ open, onClose, theme, catColor }: SchedulyChatProps) {
  const [question, setQuestion] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesRef = React.useRef<HTMLDivElement>(null);
  const submitLockRef = React.useRef(false);
  const lastSubmitAtRef = React.useRef(0);
  const lastRequestKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  React.useEffect(() => {
    const container = messagesRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, isLoading]);

  const submitQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    const now = Date.now();

    if (!trimmedQuestion || isLoading || submitLockRef.current) return;
    if (now - lastSubmitAtRef.current < 250) return;

    const priorHistory = messages.slice(-6).map((message) => ({
      role: message.role,
      text: message.text,
    }));
    const requestKey = JSON.stringify({ question: trimmedQuestion, history: priorHistory });

    if (lastRequestKeyRef.current === requestKey) {
      return;
    }

    lastSubmitAtRef.current = now;
    lastRequestKeyRef.current = requestKey;
    submitLockRef.current = true;

    setQuestion('');
    setError('');
    setMessages((current) => [...current, { role: 'user', text: trimmedQuestion }, { role: 'assistant', text: '' }]);
    setIsLoading(true);
    try {
      await streamScheduly(trimmedQuestion, (answer) => {
        setMessages((current) => current.map((message, index) => (
          index === current.length - 1 && message.role === 'assistant'
            ? { ...message, text: answer }
            : message
        )));
      }, priorHistory);
    } catch (requestError) {
      setMessages((current) => current.filter((message, index) => !(index === current.length - 1 && message.role === 'assistant' && !message.text)));
      setError(formatGeminiUserError(requestError));
    } finally {
      setIsLoading(false);
      submitLockRef.current = false;
    }
  };

  if (!open) return null;

  const suggestions = [
    { label: 'Plan my day', icon: '✨' },
    { label: 'Help me study', icon: '📚' },
    { label: 'Improve my English', icon: '🇬🇧' },
    { label: 'Review my goals', icon: '🎯' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-2 backdrop-blur-[3px] sm:p-6" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="scheduly-chat-title"
        className={cn(
          'flex h-[min(720px,calc(100vh-1rem))] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border shadow-2xl sm:h-[min(720px,calc(100vh-3rem))]',
          theme === 'dark' ? 'border-white/10 bg-[#17201b] text-white' : 'border-[#107C41]/15 bg-white text-slate-900'
        )}
      >
        <header className="flex items-center justify-between border-b border-white/15 bg-[#107C41] px-4 py-3.5 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <DynamicCat mood={'happy' as CatMood} color={catColor} size="sm" className="h-11 w-11 shrink-0" />
            <div className="min-w-0">
              <h2 id="scheduly-chat-title" className="truncate text-base font-black">Scheduly</h2>
              <p className="truncate text-xs text-white/80">Trợ lý AI của bạn</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Đóng Scheduly" onClick={onClose} className="shrink-0 text-white hover:bg-white/15 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </header>

        <div ref={messagesRef} className="flex-1 space-y-6 overflow-y-auto bg-gradient-to-b from-[#107C41]/[0.035] to-transparent p-4 sm:p-8">
          {messages.length === 0 && (
            <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center pb-8 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#107C41]/10 text-[#107C41] dark:bg-[#6ee7a5]/10 dark:text-[#6ee7a5]">
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="text-2xl font-black tracking-tight sm:text-3xl">How can I help you today?</p>
              <p className="mt-3 max-w-md text-sm leading-6 opacity-60">Ask me anything about your tasks, study, English, planning, or your day.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    onClick={() => setQuestion(suggestion.label)}
                    className="rounded-full border border-current/10 bg-background/70 px-3.5 py-2 text-xs font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-[#107C41]/35 hover:text-[#107C41]"
                  >
                    <span aria-hidden="true" className="mr-1.5">{suggestion.icon}</span>{suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={cn('flex gap-2.5', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              {message.role === 'assistant' && <DynamicCat mood={'happy' as CatMood} color={catColor} size="sm" className="mt-1 h-7 w-7 shrink-0" />}
              <div className={cn('max-w-[88%]', message.role === 'user' && 'rounded-2xl rounded-br-md bg-[#107C41] px-4 py-3 text-white shadow-sm')}>
                {message.role === 'assistant' ? <SchedulyAnswer text={message.text} /> : <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>}
              </div>
            </div>
          ))}
          {isLoading && <div className="flex items-center gap-2 pl-10 text-sm opacity-65"><Loader2 className="h-4 w-4 animate-spin" /> {isShortVocabularyQuery(messages[messages.length - 2]?.text ?? '') ? 'Scheduly đang tra từ...' : 'Scheduly đang phân tích ngữ cảnh...'}</div>}
          {error && <p className="rounded-xl border border-red-300/50 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
        </div>

        <form onSubmit={submitQuestion} className="border-t border-current/10 bg-background/80 p-3 sm:p-4">
          <div className="flex items-end gap-2 rounded-[22px] border border-current/15 bg-muted/40 p-2 shadow-sm transition focus-within:border-[#107C41]/45 focus-within:ring-2 focus-within:ring-[#107C41]/15">
            <Textarea ref={inputRef} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
            }} placeholder="Ask Scheduly anything..." aria-label="Câu hỏi cho Scheduly" rows={2} className="min-h-12 resize-none border-0 bg-transparent px-3 py-2 shadow-none focus-visible:ring-0" disabled={isLoading} />
            <Button type="submit" size="icon" aria-label="Gửi câu hỏi" disabled={!question.trim() || isLoading || submitLockRef.current} className="mb-0.5 shrink-0 rounded-full bg-[#107C41] text-white hover:bg-[#0c6334]">
              <ArrowUp className="h-5 w-5" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] opacity-45">Enter để gửi · Shift + Enter để xuống dòng</p>
        </form>
      </section>
    </div>
  );
}