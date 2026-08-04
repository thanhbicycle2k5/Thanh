import * as React from 'react';
import { cn } from '@/lib/utils';

interface SpeechBubbleProps {
  text: string;
  className?: string;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({ text, className }) => {
  return (
    <div className={cn(
      'relative max-w-xs rounded-[32px] border border-white/70 bg-white/95 px-4 py-3 shadow-2xl shadow-slate-900/10 text-sm text-slate-900 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-950/95 dark:text-slate-100',
      className
    )}>
      <div className="mb-0.5 break-words whitespace-pre-wrap">{text}</div>
      <div className="absolute left-[-0.6rem] top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 border border-white/70 bg-white/95 dark:border-slate-700/80 dark:bg-slate-950/95" />
    </div>
  );
};
