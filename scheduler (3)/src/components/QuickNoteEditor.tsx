import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const STORAGE_KEY = 'chronos_quick_note';

interface QuickNoteEditorProps {
  isMobile: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function QuickNoteEditorComponent({ isMobile, isOpen, onOpenChange }: QuickNoteEditorProps) {
  const [value, setValue] = React.useState('');
  const saveTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) ?? '';
    setValue(saved);
  }, []);

  const scheduleSave = React.useCallback((nextValue: string) => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, nextValue);
      saveTimerRef.current = null;
    }, 300);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      scheduleSave(value);
    }
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [value, isOpen, scheduleSave]);

  const handleChange = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
  }, []);

  return (
    <>
      {isMobile ? (
        isOpen ? (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => onOpenChange(false)}
            />
            <div
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-xl rounded-t-3xl border border-border bg-card p-4 shadow-2xl shadow-black/10 pointer-events-auto transition-transform duration-200"
            >
              <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-muted-foreground/40" />
              <div className="flex items-center justify-between gap-3 pb-3">
                <div>
                  <p className="text-sm font-bold">Ghi chú nhanh</p>
                  <p className="text-[11px] opacity-70">Lưu tự động, không lo mất dữ liệu khi tải lại</p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-muted/80 text-foreground transition hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Textarea
                value={value}
                onChange={handleChange}
                placeholder="Ghi gì đó..."
                rows={10}
                className="min-h-[14rem] resize-none bg-muted/70 border-border"
              />
              <Button
                className="mt-4 h-11 w-full rounded-2xl bg-[#107C41] text-white shadow-lg shadow-[#107C41]/20 hover:bg-[#0d6435]"
                onClick={() => onOpenChange(false)}
              >
                Đóng
              </Button>
            </div>
          </>
        ) : null
      ) : (
        <Popover open={isOpen} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="h-12 w-12 rounded-full bg-yellow-400 text-black shadow-2xl border border-white/10 transition hover:bg-yellow-500 hover:scale-105 active:scale-95 flex items-center justify-center"
              aria-label="Ghi chú nhanh"
            >
              <span className="text-xl font-black leading-none">T</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[22rem] max-w-[90vw] rounded-3xl border border-border bg-card p-4 shadow-2xl"
            side="top"
            align="end"
            sideOffset={12}
          >
            <div className="flex items-center justify-between gap-3 pb-2">
              <div>
                <p className="text-sm font-bold">Ghi chú nhanh</p>
                <p className="text-[11px] opacity-70">Lưu tự động vào localStorage</p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-muted/70 text-foreground transition hover:bg-muted"
                onClick={() => onOpenChange(false)}
                aria-label="Đóng ghi chú"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Textarea
              value={value}
              onChange={handleChange}
              placeholder="Ghi gì đó..."
              rows={8}
              className="min-h-[12rem] resize-none bg-muted/70 border-border"
            />
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}

export const QuickNoteEditor = React.memo(QuickNoteEditorComponent);
