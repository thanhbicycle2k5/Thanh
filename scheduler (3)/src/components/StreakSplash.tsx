import * as React from 'react';
import { ArrowRight, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { translations, type TranslationKey } from '../lib/i18n';
import type { CatColor, Language } from '../types';
import { getCatImage } from './DynamicCat';
import yesevaLatinFontUrl from '@fontsource/yeseva-one/files/yeseva-one-latin-400-normal.woff2?url';
import yesevaVietnameseFontUrl from '@fontsource/yeseva-one/files/yeseva-one-vietnamese-400-normal.woff2?url';

interface StreakSplashProps {
  open: boolean;
  previousStreak: number;
  currentStreak: number;
  catColor: CatColor;
  language: Language;
  onClose: () => void;
}

const translate = (language: Language, key: TranslationKey, replacements: Record<string, string> = {}): string => {
  let text = translations[language][key] ?? translations.en[key] ?? key;
  Object.entries(replacements).forEach(([name, value]) => {
    text = text.replaceAll(`{${name}}`, value);
  });
  return text;
};

const escapeSvgText = (text: string) => text.replace(/[&<>"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
})[character] ?? character);

const buildStreakImage = (previousStreak: number, currentStreak: number, title: string, encouragement: string, brand: string, previousLabel: string, currentLabel: string, tagline: string, logoImage: string, appIconImage: string, catImage: string, latinFontDataUrl: string, vietnameseFontDataUrl: string) => {
  const backgroundStart = '#ffffff';
  const backgroundEnd = '#ffffff';
  const titleColor = '#064e3b';
  const secondaryColor = '#166534';
  const accentColor = '#16a34a';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1146" viewBox="0 0 1080 1146">
    <defs>
      <style>
        @font-face{font-family:'Yeseva One';src:url('${latinFontDataUrl}') format('woff2');font-weight:400;font-style:normal;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
        @font-face{font-family:'Yeseva One';src:url('${vietnameseFontDataUrl}') format('woff2');font-weight:400;font-style:normal;unicode-range:U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB}
      </style>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${backgroundStart}"/><stop offset="1" stop-color="${backgroundEnd}"/></linearGradient>
      <linearGradient id="flame" x1="0" y1="1" x2="0" y2="0"><stop stop-color="#f97316"/><stop offset=".55" stop-color="#facc15"/><stop offset="1" stop-color="#fef9c3"/></linearGradient>
      <radialGradient id="glow"><stop stop-color="#facc15" stop-opacity=".55"/><stop offset="1" stop-color="#facc15" stop-opacity="0"/></radialGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="42"/></filter>
    </defs>
    <rect width="1080" height="1146" rx="72" fill="url(#bg)"/>
    <image href="${logoImage}" x="0" y="0" width="1080" height="1146" preserveAspectRatio="xMidYMid slice" opacity=".12" style="mix-blend-mode:multiply"/>
    <circle cx="540" cy="573" r="310" fill="url(#glow)" filter="url(#blur)"/>
    <g fill="${secondaryColor}" opacity=".55"><circle cx="150" cy="210" r="5"/><circle cx="888" cy="248" r="7"/><circle cx="246" cy="450" r="4"/><circle cx="839" cy="520" r="4"/><circle cx="190" cy="900" r="5"/><circle cx="900" cy="880" r="6"/></g>
    <text x="540" y="130" text-anchor="middle" fill="${accentColor}" font-family="'Yeseva One',serif" font-size="36" font-weight="700" letter-spacing="9">${escapeSvgText(brand)}</text>
    <text x="540" y="220" text-anchor="middle" fill="${titleColor}" font-family="'Yeseva One',serif" font-size="48" font-weight="700">${escapeSvgText(title)}</text>
    <text x="540" y="282" text-anchor="middle" fill="${secondaryColor}" font-family="'Yeseva One',serif" font-size="27">${escapeSvgText(encouragement)}</text>
    <image href="${appIconImage}" x="385" y="390" width="310" height="310" preserveAspectRatio="xMidYMid meet"/>
    <g transform="translate(-24 0)">
      <path d="M518 418 C493 388 510 360 535 322 C539 357 572 357 564 389 C590 375 594 350 586 329 C632 376 622 426 582 440 C556 450 531 439 518 418Z" fill="url(#flame)" stroke="#fff7cc" stroke-width="5"/>
      <path d="M548 414 C542 400 553 390 565 374 C570 393 584 397 577 413 C571 425 555 427 548 414Z" fill="#fffde7"/>
    </g>
    <image href="${catImage}" x="680" y="640" width="250" height="280" preserveAspectRatio="xMidYMid meet"/>
    <text x="320" y="950" text-anchor="middle" fill="${secondaryColor}" font-family="'Yeseva One',serif" font-size="28" font-weight="700" letter-spacing="3">${escapeSvgText(previousLabel)}</text>
    <text x="320" y="1060" text-anchor="middle" fill="${titleColor}" font-family="'Yeseva One',serif" font-size="138" font-weight="800">${previousStreak}</text>
    <path d="M455 1010 H625" stroke="${accentColor}" stroke-width="7" stroke-linecap="round"/>
    <path d="M603 987 L627 1010 L603 1033" fill="none" stroke="${accentColor}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="760" y="950" text-anchor="middle" fill="${accentColor}" font-family="'Yeseva One',serif" font-size="28" font-weight="700" letter-spacing="3">${escapeSvgText(currentLabel)}</text>
    <text x="760" y="1060" text-anchor="middle" fill="${accentColor}" font-family="'Yeseva One',serif" font-size="138" font-weight="800">${currentStreak}</text>
    <text x="540" y="1130" text-anchor="middle" fill="${secondaryColor}" font-family="'Yeseva One',serif" font-size="26" letter-spacing="4">${escapeSvgText(tagline)}</text>
  </svg>`;
};

async function createPng(svg: string): Promise<Blob> {
  await document.fonts.load('400 32px "Yeseva One"');
  const imageUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    image.src = imageUrl;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1146;
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

export function StreakSplash({ open, previousStreak, currentStreak, catColor, language, onClose }: StreakSplashProps) {
  const [isSharing, setIsSharing] = React.useState(false);
  const [displayedStreak, setDisplayedStreak] = React.useState(previousStreak);
  const [encouragementKey, setEncouragementKey] = React.useState<TranslationKey>(encouragementKeys[0]);
  const [posterLanguage, setPosterLanguage] = React.useState<Language>(language);
  const t = React.useCallback(
    (key: TranslationKey, replacements: Record<string, string> = {}) => translate(posterLanguage, key, replacements),
    [posterLanguage],
  );

  React.useEffect(() => {
    if (!open) return;
    setDisplayedStreak(previousStreak);
    setPosterLanguage(language);
    setEncouragementKey(encouragementKeys[Math.floor(Math.random() * encouragementKeys.length)]);
    const timer = window.setTimeout(() => setDisplayedStreak(currentStreak), 450);
    return () => window.clearTimeout(timer);
  }, [currentStreak, language, open, previousStreak]);

  const createCurrentPoster = async () => {
    const [logoImage, appIconImage, catImage, latinFontDataUrl, vietnameseFontDataUrl] = await Promise.all([
      loadImageAsDataUrl('/task2goal-splash-square.png'),
      loadImageAsDataUrl('/task2goal-app-icon.png'),
      loadImageAsDataUrl(getCatImage(catColor)),
      loadImageAsDataUrl(yesevaLatinFontUrl),
      loadImageAsDataUrl(yesevaVietnameseFontUrl),
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
        latinFontDataUrl,
        vietnameseFontDataUrl,
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
      <DialogContent className="streak-splash max-w-md overflow-hidden border border-amber-300/80 bg-white p-0 text-emerald-950 shadow-[0_0_32px_rgba(250,204,21,0.45),0_12px_32px_rgba(0,0,0,0.18)]" style={{ fontFamily: '"Yeseva One", serif' }}>
        <div className="relative overflow-hidden px-6 pb-6 pt-8 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_50%,rgba(250,204,21,0.28),transparent_28%),radial-gradient(ellipse_at_100%_50%,rgba(250,204,21,0.28),transparent_28%)]" />
          <img src="/task2goal-splash-square.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.12] mix-blend-multiply" />
          <div className="relative">
            <div className="mx-auto mb-3 flex flex-col items-center leading-tight text-emerald-700">
              <span className="text-sm font-black tracking-wide">Task2Goal</span>
              <span className="mt-0.5 text-[10px] font-medium text-emerald-800/70">
                From Tasks to Goals
              </span>
              <div className="mt-2 inline-flex rounded-full border border-emerald-800/15 bg-white/80 p-0.5" role="group" aria-label="Poster language">
                {(['vi', 'en'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={posterLanguage === option}
                    onClick={() => setPosterLanguage(option)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${posterLanguage === option ? 'bg-emerald-600 text-white' : 'text-emerald-900/70 hover:bg-emerald-100'}`}
                  >
                    {option === 'vi' ? 'VI' : 'EN'}
                  </button>
                ))}
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-emerald-950">{t('streakSplashTitle')}</DialogTitle>
            <DialogDescription className="mt-2 text-emerald-900/75">{t(encouragementKey)}</DialogDescription>

            <div className="relative mx-auto my-5 flex h-44 max-w-xs items-center justify-center overflow-hidden rounded-3xl border border-emerald-800/15 bg-white/80">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(250,204,21,0.14),transparent_50%)]" />
              <img src={getCatImage(catColor)} alt="" className="absolute bottom-0 right-2 z-10 h-28 w-28 object-contain" />
              <div className="relative z-0 h-40 w-40">
                <img src="/task2goal-app-icon.png" alt="Task2Goal logo" className="h-full w-full object-contain" />
                <motion.svg
                  viewBox="0 0 80 100"
                  className="absolute left-[calc(50%-2px)] top-[0%] h-10 w-8 -translate-x-1/2"
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
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-900/60">{t('streakSplashPrevious')}</p>
                <p className="mt-1 text-3xl font-black text-emerald-950">{previousStreak}</p>
              </div>
              <ArrowRight className="mt-5 h-5 w-5 text-emerald-700" aria-hidden="true" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">{t('streakSplashCurrent')}</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={displayedStreak}
                    initial={{ opacity: 0, y: 8, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.8 }}
                    transition={{ duration: 0.25 }}
                    className="mt-1 text-4xl font-black text-emerald-700"
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
              <Button type="button" variant="outline" aria-label={t('streakSplashCopyImage')} title={t('streakSplashCopyImage')} className="h-11 w-11 shrink-0 border-emerald-800/20 bg-white/70 p-0 text-emerald-950 hover:bg-white" onClick={() => void handleCopyImage()} disabled={isSharing}>
                <Copy className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="outline" className="h-11 gap-2 border-emerald-800/20 bg-white/70 text-emerald-950 hover:bg-white" onClick={() => void handleShare()} disabled={isSharing}>
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
