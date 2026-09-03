import * as React from 'react';
import { Loader2, Send, X } from 'lucide-react';
import { DynamicCat } from './DynamicCat';
import { askScheduly } from '../lib/schedulyChat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CatColor, CatMood, Theme } from '../types';

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

export function SchedulyChat({ open, onClose, theme, catColor }: SchedulyChatProps) {
  const [question, setQuestion] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesRef = React.useRef<HTMLDivElement>(null);

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
    if (!trimmedQuestion || isLoading) return;

    setQuestion('');
    setError('');
    setMessages((current) => [...current, { role: 'user', text: trimmedQuestion }]);
    setIsLoading(true);
    try {
      const answer = await askScheduly(trimmedQuestion);
      setMessages((current) => [...current, { role: 'assistant', text: answer }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể kết nối với Scheduly.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-3 sm:p-6" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="scheduly-chat-title"
        className={cn(
          'flex h-[min(720px,calc(100vh-1.5rem))] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border shadow-2xl',
          theme === 'dark' ? 'border-white/10 bg-[#17201b] text-white' : 'border-[#107C41]/15 bg-white text-slate-900'
        )}
      >
        <header className="flex items-center justify-between border-b border-current/10 bg-[#107C41] px-4 py-3 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <DynamicCat mood={'happy' as CatMood} color={catColor} size="sm" className="h-11 w-11 shrink-0" />
            <div className="min-w-0">
              <h2 id="scheduly-chat-title" className="truncate text-base font-black">Scheduly</h2>
              <p className="truncate text-xs text-white/80">Trợ lý ngôn ngữ Anh - Việt</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Đóng Scheduly" onClick={onClose} className="shrink-0 text-white hover:bg-white/15 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </header>

        <div ref={messagesRef} className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 && (
            <div className="mx-auto max-w-md py-10 text-center">
              <p className="text-lg font-bold">Bạn muốn khám phá từ hay câu nào?</p>
              <p className="mt-2 text-sm opacity-65">Hỏi Scheduly về nghĩa, sắc thái, cách dùng, phát âm hoặc bản dịch tự nhiên.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed', message.role === 'user' ? 'bg-[#107C41] text-white' : 'bg-muted')}>
                {message.text}
              </div>
            </div>
          ))}
          {isLoading && <div className="flex items-center gap-2 text-sm opacity-65"><Loader2 className="h-4 w-4 animate-spin" /> Scheduly đang phân tích ngữ cảnh...</div>}
          {error && <p className="rounded-xl border border-red-300/50 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
        </div>

        <form onSubmit={submitQuestion} className="border-t border-current/10 p-3 sm:p-4">
          <div className="flex items-end gap-2 rounded-2xl border border-current/15 bg-muted/40 p-2 focus-within:ring-2 focus-within:ring-[#107C41]/40">
            <Textarea ref={inputRef} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
            }} placeholder="Nhập câu hỏi của bạn..." aria-label="Câu hỏi cho Scheduly" rows={2} className="min-h-12 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0" disabled={isLoading} />
            <Button type="submit" size="icon" aria-label="Gửi câu hỏi" disabled={!question.trim() || isLoading} className="mb-0.5 shrink-0 bg-[#107C41] text-white hover:bg-[#0c6334]">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] opacity-50">Scheduly có thể cần thêm câu đầy đủ để giải thích chính xác.</p>
        </form>
      </section>
    </div>
  );
}