import * as React from 'react';
import { ExternalLink, Sparkles, X } from 'lucide-react';
import { DynamicCat } from './DynamicCat';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CatColor, CatMood, Theme } from '../types';

interface SchedulyChatProps {
  open: boolean;
  onClose: () => void;
  theme: Theme;
  catColor: CatColor;
}

const GEMINI_URL = 'https://gemini.google.com/';

export function SchedulyChat({ open, onClose, theme, catColor }: SchedulyChatProps) {
  if (!open) return null;

  const openGemini = () => {
    window.open(GEMINI_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-2 backdrop-blur-[3px] sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Đóng Scheduly"
            onClick={onClose}
            className="shrink-0 text-white hover:bg-white/15 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        <div className="flex flex-1 items-center justify-center overflow-y-auto bg-gradient-to-b from-[#107C41]/[0.035] to-transparent p-6 sm:p-10">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#107C41]/10 text-[#107C41] dark:bg-[#6ee7a5]/10 dark:text-[#6ee7a5]">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black tracking-tight sm:text-3xl">✨ Kết nối Gemini</h3>
            <p className="mt-4 text-sm leading-6 opacity-65">Sử dụng Gemini bằng tài khoản Google của bạn.</p>
            <p className="mt-2 max-w-sm text-xs leading-5 opacity-50">
              Scheduly sẽ mở Gemini chính thức trong tab mới. Bạn không cần nhập lại email hoặc mật khẩu tại đây.
            </p>
            <Button
              type="button"
              onClick={openGemini}
              className="mt-8 h-12 rounded-full bg-[#107C41] px-6 text-sm font-bold text-white shadow-lg shadow-[#107C41]/20 hover:bg-[#0c6334]"
            >
              Kết nối với Gemini
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-5 text-[11px] leading-5 opacity-45">Bạn sẽ đăng nhập và sử dụng Gemini trực tiếp trên trang của Google.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
