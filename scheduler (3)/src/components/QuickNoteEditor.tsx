import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cloudStorage, subscribeQuickNote } from '../lib/firebase';
import { TranslationKey } from '../lib/i18n';

const STORAGE_KEY = 'chronos_quick_note';

interface QuickNoteEditorProps {
  uid: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  t: (key: TranslationKey) => string;
}

function QuickNoteEditorComponent({ uid, isOpen, onOpenChange, t }: QuickNoteEditorProps) {
  const [value, setValue] = React.useState('');
  const [syncFailed, setSyncFailed] = React.useState(false);
  const saveTimerRef = React.useRef<number | null>(null);
  const dirtyRef = React.useRef(false);
  const valueRef = React.useRef(value);

  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  React.useEffect(() => {
    let active = true;
    dirtyRef.current = false;
    setSyncFailed(false);
    const saved = localStorage.getItem(STORAGE_KEY) ?? '';
    setValue(saved);
    valueRef.current = saved;

    if (!uid) return () => { active = false; };

    const unsubscribe = subscribeQuickNote(
      uid,
      (remoteNote, fromCache) => {
        if (!active || dirtyRef.current) return;
        if (remoteNote !== null) {
          setValue(remoteNote);
          valueRef.current = remoteNote;
          localStorage.setItem(STORAGE_KEY, remoteNote);
          return;
        }

        if (!fromCache) {
          const localNote = localStorage.getItem(STORAGE_KEY) ?? '';
          if (localNote) {
            setValue(localNote);
            valueRef.current = localNote;
            dirtyRef.current = true;
            void cloudStorage.saveQuickNote(uid, localNote)
              .then(() => {
                if (active && valueRef.current === localNote) dirtyRef.current = false;
              })
              .catch((error: unknown) => {
                console.error('Unable to sync quick note:', error);
                if (active) setSyncFailed(true);
              });
          } else {
            setValue('');
            valueRef.current = '';
          }
        }
      },
      (error) => {
        console.error('Unable to subscribe to quick note:', error);
        if (active) setSyncFailed(true);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [uid]);

  React.useEffect(() => {
    if (!dirtyRef.current) return;

    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    const noteToSave = value;
    let active = true;
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      localStorage.setItem(STORAGE_KEY, noteToSave);

      if (!uid) {
        dirtyRef.current = false;
        return;
      }

      void cloudStorage.saveQuickNote(uid, noteToSave)
        .then(() => {
          if (active && valueRef.current === noteToSave) {
            dirtyRef.current = false;
            setSyncFailed(false);
          }
        })
        .catch((error: unknown) => {
          console.error('Unable to sync quick note:', error);
          if (active) setSyncFailed(true);
        });
    }, 300);

    return () => {
      active = false;
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [value, uid]);

  const handleChange = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    dirtyRef.current = true;
    setValue(event.target.value);
  }, []);

  const trigger = (
    <button
      type="button"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={() => onOpenChange(!isOpen)}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-2xl transition-all hover:scale-110 active:scale-95"
      aria-label={t('quickNoteTitle')}
      title={t('quickNoteTitle')}
      aria-expanded={isOpen}
    >
      <span className="text-xl font-black leading-none">N</span>
    </button>
  );

  const statusText = syncFailed
    ? t('quickNoteSyncError')
    : uid
      ? t('quickNoteAccountDescription')
      : t('quickNoteLocalDescription');

  return (
    <>
      {uid ? (
        <Popover open={isOpen} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent className="w-[22rem] max-w-[90vw] rounded-3xl border border-border bg-card p-4 shadow-2xl" side="top" align="end" sideOffset={12}>
            <div className="flex items-center justify-between gap-3 pb-2">
              <div>
                <p className="text-sm font-bold">{t('quickNoteTitle')}</p>
                <p className="text-[11px] opacity-70">{statusText}</p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-muted/70 text-foreground transition hover:bg-muted"
                onClick={() => onOpenChange(false)}
                aria-label={t('close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Textarea
              value={value}
              onChange={handleChange}
              placeholder={t('quickNotePlaceholder')}
              rows={8}
              maxLength={50000}
              className="min-h-[12rem] resize-none border-border bg-muted/70"
            />
          </PopoverContent>
        </Popover>
      ) : (
        <>
          {trigger}
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
              <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-xl rounded-t-3xl border border-border bg-card p-4 shadow-2xl shadow-black/10 pointer-events-auto">
                <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-muted-foreground/40" />
                <div className="flex items-center justify-between gap-3 pb-3">
                  <div>
                    <p className="text-sm font-bold">{t('quickNoteTitle')}</p>
                    <p className="text-[11px] opacity-70">{statusText}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-muted/80 text-foreground transition hover:bg-muted"
                    aria-label={t('close')}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <Textarea
                  value={value}
                  onChange={handleChange}
                  placeholder={t('quickNotePlaceholder')}
                  rows={10}
                  maxLength={50000}
                  className="min-h-[14rem] resize-none border-border bg-muted/70"
                />
                <Button className="mt-4 h-11 w-full rounded-2xl" onClick={() => onOpenChange(false)}>
                  {t('close')}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

export const QuickNoteEditor = React.memo(QuickNoteEditorComponent);
