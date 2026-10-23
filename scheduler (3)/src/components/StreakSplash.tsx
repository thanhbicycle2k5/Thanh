import * as React from 'react';
import { ArrowRight, Copy, Share2, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { translations, type TranslationKey } from '../lib/i18n';
import type { CatColor, Language } from '../types';
import { getCatImage } from './DynamicCat';

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not decode streak poster image.'));
    image.src = src;
  });
}

async function createPng(
  images: { logo: string; appIcon: string; cat: string },
  text: { brand: string; title: string; encouragement: string; previousLabel: string; currentLabel: string; tagline: string },
  previousStreak: number,
  currentStreak: number,
): Promise<Blob> {
  const fontSample = Object.values(text).join(' ');
  await document.fonts.load('400 32px "Yeseva One"', fontSample);
  await document.fonts.ready;
  const [logo, appIcon, cat] = await Promise.all([
    loadImage(images.logo),
    loadImage(images.appIcon),
    loadImage(images.cat),
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1146;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not supported.');

  const titleColor = '#064e3b';
  const secondaryColor = '#166534';
  const accentColor = '#16a34a';
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.globalAlpha = 0.12;
  context.globalCompositeOperation = 'multiply';
  context.drawImage(logo, 0, 0, canvas.width, canvas.height);
  context.restore();

  const drawGlow = (x: number, y: number, radius: number, centerAlpha: number) => {
    const glow = context.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, `rgba(250,204,21,${centerAlpha})`);
    glow.addColorStop(0.36, `rgba(250,204,21,${centerAlpha * 0.55})`);
    glow.addColorStop(1, 'rgba(250,204,21,0)');
    context.fillStyle = glow;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  };
  drawGlow(540, 573, 310, 0.55);
  drawGlow(520, 390, 230, 0.7);

  context.fillStyle = `${secondaryColor}8c`;
  [[150, 210, 5], [888, 248, 7], [246, 450, 4], [839, 520, 4], [190, 900, 5], [900, 880, 6]]
    .forEach(([x, y, radius]) => {
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    });

  const drawText = (value: string, x: number, y: number, size: number, color: string, weight = 400) => {
    context.font = `${weight} ${size}px "Yeseva One", serif`;
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.fillStyle = color;
    context.fillText(value, x, y);
  };
  drawText(text.brand, 540, 130, 36, accentColor, 700);
  drawText(text.title, 540, 220, 48, titleColor, 700);
  drawText(text.encouragement, 540, 282, 27, secondaryColor);
  context.save();
  context.globalCompositeOperation = 'multiply';
  context.drawImage(appIcon, 385, 390, 310, 310);
  context.restore();

  context.save();
  context.translate(-32, 0);
  const flame = new Path2D('M518 418 C493 388 510 360 535 322 C539 357 572 357 564 389 C590 375 594 350 586 329 C632 376 622 426 582 440 C556 450 531 439 518 418Z');
  const flameFill = context.createLinearGradient(0, 440, 0, 322);
  flameFill.addColorStop(0, '#f97316');
  flameFill.addColorStop(0.55, '#facc15');
  flameFill.addColorStop(1, '#fef9c3');
  context.fillStyle = flameFill;
  context.fill(flame);
  context.lineWidth = 5;
  context.strokeStyle = '#fff7cc';
  context.stroke(flame);
  context.fillStyle = '#fffde7';
  context.fill(new Path2D('M548 414 C542 400 553 390 565 374 C570 393 584 397 577 413 C571 425 555 427 548 414Z'));
  context.restore();
  context.drawImage(cat, 680, 640, 250, 280);

  drawText(text.previousLabel, 320, 950, 28, secondaryColor, 700);
  drawText(String(previousStreak), 320, 1060, 138, titleColor, 800);
  context.strokeStyle = accentColor;
  context.lineWidth = 7;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(455, 1010);
  context.lineTo(625, 1010);
  context.moveTo(603, 987);
  context.lineTo(627, 1010);
  context.lineTo(603, 1033);
  context.stroke();
  drawText(text.currentLabel, 760, 950, 28, accentColor, 700);
  drawText(String(currentStreak), 760, 1060, 138, accentColor, 800);
  drawText(text.tagline, 540, 1130, 26, secondaryColor);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not encode streak image.')), 'image/png');
  });
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
  const [isMusicPlaying, setIsMusicPlaying] = React.useState(false);
  const musicRef = React.useRef<HTMLAudioElement | null>(null);
  const [displayedStreak, setDisplayedStreak] = React.useState(previousStreak);
  const [encouragementKey, setEncouragementKey] = React.useState<TranslationKey>(encouragementKeys[0]);
  const [posterLanguage, setPosterLanguage] = React.useState<Language>(language);
  const t = React.useCallback(
    (key: TranslationKey, replacements: Record<string, string> = {}) => translate(posterLanguage, key, replacements),
    [posterLanguage],
  );

  React.useEffect(() => {
    if (!open) return;
    const audio = new Audio('/music/clementi-celebration-piano.oga');
    let disposed = false;
    audio.loop = true;
    audio.volume = 0.2;
    musicRef.current = audio;
    void audio.play().then(() => {
      if (disposed) return;
      setIsMusicPlaying(true);
    }).catch((error: unknown) => {
      if (disposed) return;
      console.warn('Streak popup music could not start automatically:', error);
      setIsMusicPlaying(false);
      toast.info(translate(language, 'streakSplashMusicBlocked'));
    });
    return () => {
      disposed = true;
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      audio.load();
      musicRef.current = null;
    };
  }, [language, open]);

  React.useEffect(() => {
    if (!open) return;
    setDisplayedStreak(previousStreak);
    setPosterLanguage(language);
    setEncouragementKey(encouragementKeys[Math.floor(Math.random() * encouragementKeys.length)]);
    const timer = window.setTimeout(() => setDisplayedStreak(currentStreak), 450);
    return () => window.clearTimeout(timer);
  }, [currentStreak, language, open, previousStreak]);

  const togglePopupMusic = async () => {
    let audio = musicRef.current;
    if (!audio) {
      audio = new Audio('/music/clementi-celebration-piano.oga');
      audio.loop = true;
      audio.volume = 0.2;
      musicRef.current = audio;
    }
    if (!audio.paused) {
      audio.pause();
      setIsMusicPlaying(false);
      return;
    }
    try {
      await audio.play();
      setIsMusicPlaying(true);
    } catch (error) {
      console.error('Streak popup music could not be played:', error);
      toast.error(translate(posterLanguage, 'streakSplashMusicBlocked'));
      setIsMusicPlaying(false);
    }
  };

  const createCurrentPoster = async () => {
    const [logoImage, appIconImage, catImage] = await Promise.all([
      loadImageAsDataUrl('/task2goal-splash-square.png'),
      loadImageAsDataUrl('/task2goal-app-icon.png'),
      loadImageAsDataUrl(getCatImage(catColor)),
    ]);
    return createPng(
      { logo: logoImage, appIcon: appIconImage, cat: catImage },
      {
        brand: t('streakSplashBrand'),
        title: t('streakSplashTitle'),
        encouragement: t(encouragementKey),
        previousLabel: t('streakSplashPrevious'),
        currentLabel: t('streakSplashCurrent'),
        tagline: t('streakSplashTagline'),
      },
      previousStreak,
      currentStreak,
    );
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

      const posterBlob = await createCurrentPoster();
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
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-2 text-emerald-800"
                aria-label={t(isMusicPlaying ? 'streakSplashMusicPause' : 'streakSplashMusicPlay')}
                title={t(isMusicPlaying ? 'streakSplashMusicPause' : 'streakSplashMusicPlay')}
                onClick={() => void togglePopupMusic()}
              >
                {isMusicPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
            <DialogTitle className="text-xl font-bold text-emerald-950">{t('streakSplashTitle')}</DialogTitle>
            <DialogDescription className="mt-2 text-emerald-900/75">{t(encouragementKey)}</DialogDescription>

            <div className="relative mx-auto my-5 flex h-44 max-w-xs items-center justify-center overflow-hidden rounded-3xl border border-emerald-800/15 bg-white/80">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(250,204,21,0.14),transparent_50%)]" />
              <img src={getCatImage(catColor)} alt="" className="absolute bottom-0 right-2 z-10 h-28 w-28 object-contain" />
              <div className="relative z-0 h-40 w-40">
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-[24%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(250,204,21,0.7)_0%,rgba(250,204,21,0.38)_36%,rgba(250,204,21,0)_72%)] blur-xl"
                  animate={{ scale: [0.82, 1.12, 0.82], opacity: [0.72, 1, 0.72] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <img src="/task2goal-app-icon.png" alt="Task2Goal logo" className="relative h-full w-full object-contain mix-blend-multiply" />
                <motion.svg
                  viewBox="0 0 80 100"
                  className="absolute left-[calc(50%-4px)] top-[0%] h-10 w-8 -translate-x-1/2"
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
