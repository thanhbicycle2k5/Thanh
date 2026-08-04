import * as React from 'react';
import { cn } from '@/lib/utils';

interface SpeechBubbleProps {
  text: string;
  className?: string;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({ text, className }) => {
  return (
    <div className={cn(
      'relative min-w-[18rem] max-w-[26rem] rounded-[28px] border border-white/70 bg-white/95 px-5 py-3 shadow-2xl shadow-slate-900/10 text-sm text-slate-900 text-left backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-950/95 dark:text-slate-100',
      className
    )}>
      <div className="break-words whitespace-pre-wrap">{text}</div>
      <div className="absolute left-[-0.55rem] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border border-white/70 bg-white/95 dark:border-slate-700/80 dark:bg-slate-950/95" />
    </div>
  );
};
