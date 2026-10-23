import * as React from 'react';
import { ArrowRight, Copy, Flame, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { TranslationKey } from '../lib/i18n';
import type { CatColor, Theme } from '../types';
import { getCatImage } from './DynamicCat';

interface StreakSplashProps {
  open: boolean;
  previousStreak: number;
  currentStreak: number;
  catColor: CatColor;
  theme: Theme;
  t: (key: TranslationKey, replacements?: Record<string, string>) => string;
  onClose: () => void;
}

const escapeSvgText = (text: string) => text.replace(/[&<>"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
})[character] ?? character);

const buildStreakImage = (previousStreak: number, currentStreak: number, title: string, encouragement: string, brand: string, previousLabel: string, currentLabel: string, tagline: string, logoImage: string, catImage: string, theme: Theme) => {
  const isDark = theme === 'dark';
  const backgroundStart = isDark ? '#062c20' : '#effff4';
  const backgroundEnd = isDark ? '#0b4932' : '#d5f7df';
  const titleColor = isDark ? '#f0fdf4' : '#064e3b';
  const secondaryColor = isDark ? '#bbf7d0' : '#166534';
  const accentColor = isDark ? '#4ade80' : '#16a34a';
  const logoBlendMode = isDark ? 'screen' : 'multiply';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${backgroundStart}"/><stop offset="1" stop-color="${backgroundEnd}"/></linearGradient>
      <linearGradient id="logo" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#047857"/><stop offset="1" stop-color="#65a30d"/></linearGradient>
      <linearGradient id="flame" x1="0" y1="1" x2="0" y2="0"><stop stop-color="#f97316"/><stop offset=".55" stop-color="#facc15"/><stop offset="1" stop-color="#fef9c3"/></linearGradient>
      <radialGradient id="glow"><stop stop-color="#facc15" stop-opacity=".55"/><stop offset="1" stop-color="#facc15" stop-opacity="0"/></radialGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="42"/></filter>
    </defs>
    <rect width="1080" height="1350" rx="72" fill="url(#bg)"/>
    <image href="${logoImage}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice" opacity=".16" style="mix-blend-mode:${logoBlendMode}"/>
    <circle cx="540" cy="675" r="310" fill="url(#glow)" filter="url(#blur)"/>
    <g fill="${secondaryColor}" opacity=".55"><circle cx="150" cy="210" r="5"/><circle cx="888" cy="248" r="7"/><circle cx="246" cy="450" r="4"/><circle cx="839" cy="520" r="4"/><circle cx="190" cy="900" r="5"/><circle cx="900" cy="880" r="6"/></g>
    <text x="540" y="130" text-anchor="middle" fill="${accentColor}" font-family="Arial,sans-serif" font-size="36" font-weight="700" letter-spacing="9">${escapeSvgText(brand)}</text>
    <text x="540" y="220" text-anchor="middle" fill="${titleColor}" font-family="Arial,sans-serif" font-size="48" font-weight="700">${escapeSvgText(title)}</text>
    <text x="540" y="282" text-anchor="middle" fill="${secondaryColor}" font-family="Arial,sans-serif" font-size="27">${escapeSvgText(encouragement)}</text>
    <g transform="translate(540 610)" fill="none" stroke="url(#logo)" stroke-width="27" stroke-linecap="round" stroke-linejoin="round">
      <path d="M-205 -75 C-135 -105 -65 -95 0 -58 C65 -95 135 -105 205 -75 L205 -40 C135 -65 65 -55 0 -20 C-65 -55 -135 -65 -205 -40Z" fill="url(#logo)" stroke="none"/>
      <path d="M-205 -25 H205"/>
      <path d="M-105 -25 V170 C-105 250 -45 300 30 300 H105 C180 300 220 250 220 185 V55 H105"/>
      <circle cx="58" cy="162" r="55" stroke-width="14"/>
      <path d="M58 162 V126 M58 162 L83 145" stroke-width="12"/>
    </g>
    <path d="M518 446 C493 416 510 388 535 350 C539 385 572 385 564 417 C590 403 594 378 586 357 C632 404 622 454 582 468 C556 478 531 467 518 446Z" fill="url(#flame)" stroke="#fff7cc" stroke-width="5"/>
    <path d="M548 442 C542 428 553 418 565 402 C570 421 584 425 577 441 C571 453 555 455 548 442Z" fill="#fffde7"/>
    <image href="${catImage}" x="680" y="640" width="250" height="280" preserveAspectRatio="xMidYMid meet"/>
    <text x="320" y="1040" text-anchor="middle" fill="${secondaryColor}" font-family="Arial,sans-serif" font-size="28" font-weight="700" letter-spacing="3">${escapeSvgText(previousLabel)}</text>
    <text x="320" y="1165" text-anchor="middle" fill="${titleColor}" font-family="Arial,sans-serif" font-size="138" font-weight="800">${previousStreak}</text>
    <path d="M455 1115 H625" stroke="${accentColor}" stroke-width="7" stroke-linecap="round"/>
    <path d="M603 1092 L627 1115 L603 1138" fill="none" stroke="${accentColor}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="760" y="1040" text-anchor="middle" fill="${accentColor}" font-family="Arial,sans-serif" font-size="28" font-weight="700" letter-spacing="3">${escapeSvgText(currentLabel)}</text>
    <text x="760" y="1165" text-anchor="middle" fill="${accentColor}" font-family="Arial,sans-serif" font-size="138" font-weight="800">${currentStreak}</text>
    <text x="540" y="1290" text-anchor="middle" fill="${secondaryColor}" font-family="Arial,sans-serif" font-size="26" letter-spacing="4">${escapeSvgText(tagline)}</text>
  </svg>`;
};

async function createPng(svg: string): Promise<Blob> {
  const imageUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    image.src = imageUrl;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not supported.');
    context.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Could not encode streak image.')), 'image/png');
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function downloadPoster(blob: Blob, filename: string) {
  const imageUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
}

async function loadImageAsDataUrl(src: string): Promise<string> {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Could not load streak poster image (${response.status}).`);
  const imageBlob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not encode streak poster image.'));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not encode streak poster image.'));
    reader.readAsDataURL(imageBlob);
  });
}

const encouragementKeys: TranslationKey[] = [
  'streakSplashDescription',
  'streakSplashEncouragement2',
  'streakSplashEncouragement3',
  'streakSplashEncouragement4',
  'streakSplashEncouragement5',
];

export function StreakSplash({ open, previousStreak, currentStreak, catColor, theme, t, onClose }: StreakSplashProps) {
  const [isSharing, setIsSharing] = React.useState(false);
  const [displayedStreak, setDisplayedStreak] = React.useState(previousStreak);
  const [encouragementKey, setEncouragementKey] = React.useState<TranslationKey>(encouragementKeys[0]);
  const isDark = theme === 'dark';

  React.useEffect(() => {
    if (!open) return;
    setDisplayedStreak(previousStreak);
    setEncouragementKey(encouragementKeys[Math.floor(Math.random() * encouragementKeys.length)]);
    const timer = window.setTimeout(() => setDisplayedStreak(currentStreak), 450);
    return () => window.clearTimeout(timer);
  }, [currentStreak, open, previousStreak]);

  const createCurrentPoster = async () => {
    const [logoImage, catImage] = await Promise.all([
      loadImageAsDataUrl('/task2goal-splash-square.png'),
      loadImageAsDataUrl(getCatImage(catColor)),
    ]);
    return createPng(buildStreakImage(
        previousStreak,
        currentStreak,
        t('streakSplashTitle'),
        t(encouragementKey),
        t('streakSplashBrand'),
        t('streakSplashPrevious'),
        t('streakSplashCurrent'),
        t('streakSplashTagline'),
        logoImage,
        catImage,
        theme,
      ));
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const blob = await createCurrentPoster();
      const file = new File([blob], `streak-${currentStreak}-days.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: t('streakSplashShareTitle', { days: String(currentStreak) }),
          });
        } catch (error) {
          if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
        }
      } else {
        downloadPoster(blob, file.name);
        toast.info(t('streakSplashShareDownloaded'));
      }
    } catch (error) {
      console.error('Could not share streak image:', error);
      toast.error(t('streakSplashShareError'));
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyImage = async () => {
    setIsSharing(true);
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        const blob = await createCurrentPoster();
        downloadPoster(blob, `streak-${currentStreak}-days.png`);
        toast.info(t('streakSplashShareDownloaded'));
        return;
      }

      const posterBlob = createCurrentPoster();
      const clipboardWrite = navigator.clipboard.write([
        new ClipboardItem({ 'image/png': posterBlob }),
      ]);
      await clipboardWrite;
      toast.success(t('streakSplashImageCopied'));
    } catch (error) {
      console.error('Could not copy streak image:', error);
      toast.error(t('streakSplashCopyError'));
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className={`max-w-md overflow-hidden border p-0 shadow-2xl ${isDark ? 'border-emerald-300/20 bg-[#062c20] text-emerald-50' : 'border-emerald-700/15 bg-[#effff4] text-emerald-950'}`}>
        <div className="relative overflow-hidden px-6 pb-6 pt-8 text-center">
          <div className={`pointer-events-none absolute inset-0 ${isDark ? 'bg-[radial-gradient(ellipse_at_25%_0%,rgba(74,222,128,0.12),transparent_45%),radial-gradient(ellipse_at_100%_100%,rgba(16,185,129,0.1),transparent_45%)]' : 'bg-[radial-gradient(ellipse_at_25%_0%,rgba(74,222,128,0.16),transparent_45%),radial-gradient(ellipse_at_100%_100%,rgba(16,185,129,0.12),transparent_45%)]'}`} />
          <img src="/task2goal-splash-square.png" alt="" className={`pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.16] ${isDark ? 'mix-blend-screen' : 'mix-blend-multiply'}`} />
          <div className="relative">
            <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full ${isDark ? 'bg-emerald-300/15 text-emerald-300' : 'bg-emerald-700/10 text-emerald-700'}`}>
              <Flame className="h-5 w-5" aria-hidden="true" />
            </div>
            <DialogTitle className={`text-xl font-bold ${isDark ? 'text-emerald-50' : 'text-emerald-950'}`}>{t('streakSplashTitle')}</DialogTitle>
            <DialogDescription className={`mt-2 ${isDark ? 'text-emerald-100/80' : 'text-emerald-900/75'}`}>{t(encouragementKey)}</DialogDescription>

            <div className={`relative mx-auto my-5 flex h-44 max-w-xs items-center justify-center overflow-hidden rounded-3xl border ${isDark ? 'border-emerald-100/15 bg-emerald-100/[0.06]' : 'border-emerald-800/15 bg-white/45'}`}>
              <div className={`absolute inset-0 ${isDark ? 'bg-[radial-gradient(circle_at_50%_25%,rgba(74,222,128,0.18),transparent_50%)]' : 'bg-[radial-gradient(circle_at_50%_25%,rgba(74,222,128,0.16),transparent_50%)]'}`} />
              <img src={getCatImage(catColor)} alt="" className="absolute bottom-0 right-2 z-10 h-28 w-28 object-contain" />
              <svg viewBox="0 0 240 220" className="relative z-0 h-40 w-40" role="img" aria-label="Task2Goal logo with a jumping flame">
                <defs>
                  <linearGradient id="splash-logo" x1="0" x2="1">
                    <stop stopColor="#047857" />
                    <stop offset="1" stopColor="#65a30d" />
                  </linearGradient>
                  <linearGradient id="splash-flame" x1="0" y1="1" x2="0" y2="0">
                    <stop stopColor="#f97316" />
                    <stop offset=".6" stopColor="#facc15" />
                    <stop offset="1" stopColor="#fef9c3" />
                  </linearGradient>
                </defs>
                <path d="M23 72 Q58 55 119 84 Q180 55 217 72 V91 Q164 76 119 102 Q74 76 23 91Z" fill="url(#splash-logo)" />
                <path d="M23 95 H217 M64 95 V174 Q64 204 94 204 H144 Q190 204 190 163 V121 H155" fill="none" stroke="url(#splash-logo)" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="128" cy="153" r="22" fill="none" stroke="url(#splash-logo)" strokeWidth="8" />
                <path d="M128 153 V138 M128 153 L140 144" fill="none" stroke="url(#splash-logo)" strokeWidth="6" strokeLinecap="round" />
                <motion.path
                  d="M99 78 C81 58 96 39 114 12 C117 38 144 37 138 58 C156 48 160 31 154 16 C187 49 180 79 151 90 C132 98 108 92 99 78Z"
                  fill="url(#splash-flame)"
                  stroke="#fff7cc"
                  strokeWidth="3"
                  animate={{ y: [0, -9, 0], scale: [1, 1.04, 1] }}
                  transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.path
                  d="M122 77 C118 66 127 58 137 48 C140 61 151 64 145 76 C140 84 127 85 122 77Z"
                  fill="#fffde7"
                  animate={{ y: [0, -9, 0] }}
                  transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
                />
              </svg>
            </div>

            <div className="mb-6 flex items-center justify-center gap-5">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-emerald-100/60' : 'text-emerald-900/60'}`}>{t('streakSplashPrevious')}</p>
                <p className={`mt-1 text-3xl font-black ${isDark ? 'text-emerald-50' : 'text-emerald-950'}`}>{previousStreak}</p>
              </div>
              <ArrowRight className={`mt-5 h-5 w-5 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`} aria-hidden="true" />
              <div>
                <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>{t('streakSplashCurrent')}</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={displayedStreak}
                    initial={{ opacity: 0, y: 8, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.8 }}
                    transition={{ duration: 0.25 }}
                    className={`mt-1 text-4xl font-black ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}
                  >
                    {displayedStreak}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            <div className="mx-auto flex max-w-xs gap-3">
              <Button className="h-11 flex-1 bg-emerald-600 font-bold text-white hover:bg-emerald-500" onClick={onClose}>
                {t('streakSplashContinue')}
              </Button>
              <Button type="button" variant="outline" aria-label={t('streakSplashCopyImage')} title={t('streakSplashCopyImage')} className={`h-11 w-11 shrink-0 p-0 ${isDark ? 'border-emerald-100/20 bg-emerald-100/5 text-emerald-50 hover:bg-emerald-100/10' : 'border-emerald-800/20 bg-white/50 text-emerald-950 hover:bg-white/80'}`} onClick={() => void handleCopyImage()} disabled={isSharing}>
                <Copy className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="outline" className={`h-11 gap-2 ${isDark ? 'border-emerald-100/20 bg-emerald-100/5 text-emerald-50 hover:bg-emerald-100/10 hover:text-white' : 'border-emerald-800/20 bg-white/50 text-emerald-950 hover:bg-white/80'}`} onClick={() => void handleShare()} disabled={isSharing}>
                <Share2 className="h-4 w-4" aria-hidden="true" />
                {t('streakSplashShare')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
