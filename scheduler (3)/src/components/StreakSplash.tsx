import * as React from 'react';
import { ArrowRight, Copy, Share2 } from 'lucide-react';
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

const buildStreakImage = (previousStreak: number, currentStreak: number, title: string, encouragement: string, brand: string, previousLabel: string, currentLabel: string, tagline: string, logoImage: string, appIconImage: string, catImage: string, theme: Theme) => {
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
    <image href="${appIconImage}" x="385" y="390" width="310" height="310" preserveAspectRatio="xMidYMid meet"/>
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
    const [logoImage, appIconImage, catImage] = await Promise.all([
      loadImageAsDataUrl('/task2goal-splash-square.png'),
      loadImageAsDataUrl('/task2goal-app-icon.png'),
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
        appIconImage,
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
            <div className={`mx-auto mb-3 flex flex-col items-center leading-tight ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              <span className="text-sm font-black tracking-wide">Task2Goal</span>
              <span className={`mt-0.5 text-[10px] font-medium ${isDark ? 'text-emerald-100/70' : 'text-emerald-800/70'}`}>
                From Tasks to Goals
              </span>
            </div>
            <DialogTitle className={`text-xl font-bold ${isDark ? 'text-emerald-50' : 'text-emerald-950'}`}>{t('streakSplashTitle')}</DialogTitle>
            <DialogDescription className={`mt-2 ${isDark ? 'text-emerald-100/80' : 'text-emerald-900/75'}`}>{t(encouragementKey)}</DialogDescription>

            <div className={`relative mx-auto my-5 flex h-44 max-w-xs items-center justify-center overflow-hidden rounded-3xl border ${isDark ? 'border-emerald-100/15 bg-emerald-100/[0.06]' : 'border-emerald-800/15 bg-white/45'}`}>
              <div className={`absolute inset-0 ${isDark ? 'bg-[radial-gradient(circle_at_50%_25%,rgba(74,222,128,0.18),transparent_50%)]' : 'bg-[radial-gradient(circle_at_50%_25%,rgba(74,222,128,0.16),transparent_50%)]'}`} />
              <img src={getCatImage(catColor)} alt="" className="absolute bottom-0 right-2 z-10 h-28 w-28 object-contain" />
              <div className="relative z-0 h-40 w-40">
                <img src="/task2goal-app-icon.png" alt="Task2Goal logo" className="h-full w-full object-contain" />
                <motion.svg
                  viewBox="0 0 80 100"
                  className="absolute left-1/2 top-[13%] h-14 w-12 -translate-x-1/2"
                  role="img"
                  aria-label="Jumping flame"
                  animate={{ y: [0, -8, 0], scale: [1, 1.04, 1] }}
                  transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <defs>
                    <linearGradient id="splash-flame" x1="0" y1="1" x2="0" y2="0">
                      <stop stopColor="#f97316" />
                      <stop offset=".6" stopColor="#facc15" />
                      <stop offset="1" stopColor="#fef9c3" />
                    </linearGradient>
                  </defs>
                  <path d="M40 4 C31 22 18 31 19 49 C12 43 9 35 10 28 C-3 48 3 72 21 82 C36 91 58 84 66 68 C77 45 58 25 48 17 C50 31 46 37 41 40 C44 25 43 13 40 4Z" fill="url(#splash-flame)" stroke="#fff7cc" strokeWidth="3" />
                  <path d="M37 64 C31 55 39 48 45 42 C47 51 55 54 52 63 C49 71 40 72 37 64Z" fill="#fffde7" />
                </motion.svg>
              </div>
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
