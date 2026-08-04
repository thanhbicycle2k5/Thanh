import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { SpeechBubble } from './SpeechBubble';

interface SpeechBubbleOverlayProps {
  text: string;
  duration?: number;
  className?: string;
  onClose?: () => void;
}

export const SpeechBubbleOverlay: React.FC<SpeechBubbleOverlayProps> = ({
  text,
  duration = 5000,
  className,
  onClose,
}) => {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => window.clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.96 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={cn('pointer-events-none relative z-50', className)}
      >
        <SpeechBubble text={text} />
      </motion.div>
    </AnimatePresence>
  );
};
