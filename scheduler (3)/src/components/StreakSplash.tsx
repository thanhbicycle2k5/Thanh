import * as React from 'react';
import { ArrowRight, Flame, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { TranslationKey } from '../lib/i18n';
import type { CatColor } from '../types';
import { getCatImage } from './DynamicCat';

interface StreakSplashProps {
  open: boolean;
  previousStreak: number;
  currentStreak: number;
  catColor: CatColor;
  t: (key: TranslationKey, replacements?: Record<string, string>) => string;
  onClose: () => void;
}

const escapeSvgText = (text: string) => text.replace(/[&<>"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
})[character] ?? character);

const buildStreakImage = (previousStreak: number, currentStreak: number, title: string, encouragement: string, brand: string, tagline: string, logoImage: string, catImage: string) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#10152f"/><stop offset="1" stop-color="#253c68"/></linearGradient>
      <linearGradient id="pencil" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#e88732"/><stop offset=".5" stop-color="#ffd166"/><stop offset="1" stop-color="#e88732"/></linearGradient>
      <linearGradient id="flame" x1="0" y1="1" x2="0" y2="0"><stop stop-color="#ff7b22"/><stop offset=".55" stop-color="#ffd166"/><stop offset="1" stop-color="#fff6bd"/></linearGradient>
      <radialGradient id="glow"><stop stop-color="#ffd166" stop-opacity=".72"/><stop offset="1" stop-color="#ff9f1c" stop-opacity="0"/></radialGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="32"/></filter>
    </defs>
    <rect width="1080" height="1350" rx="72" fill="url(#bg)"/>
    <image href="${logoImage}" x="90" y="250" width="900" height="900" preserveAspectRatio="xMidYMid meet" opacity=".055"/>
    <circle cx="540" cy="390" r="300" fill="url(#glow)" filter="url(#blur)"/>
    <g fill="#fff" opacity=".5"><circle cx="150" cy="210" r="5"/><circle cx="888" cy="248" r="7"/><circle cx="246" cy="450" r="4"/><circle cx="839" cy="520" r="4"/><circle cx="190" cy="900" r="5"/><circle cx="900" cy="880" r="6"/></g>
    <text x="540" y="150" text-anchor="middle" fill="#ffd166" font-family="Arial,sans-serif" font-size="36" font-weight="700" letter-spacing="9">${escapeSvgText(brand)}</text>
    <text x="540" y="242" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="48" font-weight="700">${escapeSvgText(title)}</text>
    <text x="540" y="310" text-anchor="middle" fill="#dbeafe" font-family="Arial,sans-serif" font-size="27">${escapeSvgText(encouragement)}</text>
    <image href="${catImage}" x="350" y="365" width="380" height="430" preserveAspectRatio="xMidYMid meet" opacity=".24"/>
    <g transform="translate(540 520)">
      <circle r="206" fill="#fff" opacity=".06"/>
      <circle r="176" fill="none" stroke="#ffd166" stroke-opacity=".3" stroke-width="3"/>
      <path d="M-38 36 Q-95 -45 -42 -121 Q-39 -71 0 -99 Q31 -140 18 -184 Q115 -98 53 -8 Q104 -40 98 -92 Q155 -6 69 55Z" fill="url(#flame)" stroke="#fff2bd" stroke-width="5"/>
      <path d="M-1 34 Q-41 -15 -12 -59 Q-6 -29 17 -46 Q39 -68 28 -91 Q81 -38 47 11 Q69 -5 67 -30 Q96 22 46 49Z" fill="#fff7d1"/>
      <path d="M-48 32 L48 32 L37 299 L0 362 L-37 299Z" fill="url(#pencil)" stroke="#ffe3a3" stroke-width="6"/>
      <path d="M-34 295 L34 295 L0 362Z" fill="#f2d6a0"/>
      <path d="M-13 337 L13 337 L0 370Z" fill="#283248"/>
      <path d="M-46 78 L46 78 M-43 104 L43 104" stroke="#b96a2c" stroke-opacity=".55" stroke-width="6"/>
      <path d="M-47 55 L47 55" stroke="#fff3d2" stroke-width="10"/>
    </g>
    <text x="540" y="1010" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="142" font-weight="800">${previousStreak}</text>
    <path d="M455 1060 H625" stroke="#ffd166" stroke-width="6" stroke-linecap="round"/>
    <path d="M603 1038 L627 1060 L603 1082" fill="none" stroke="#ffd166" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="540" y="1190" text-anchor="middle" fill="#ffd166" font-family="Arial,sans-serif" font-size="120" font-weight="800">${currentStreak}</text>
    <text x="540" y="1270" text-anchor="middle" fill="#dbeafe" font-family="Arial,sans-serif" font-size="30" letter-spacing="4">${escapeSvgText(tagline)}</text>
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

export function StreakSplash({ open, previousStreak, currentStreak, catColor, t, onClose }: StreakSplashProps) {
  const [isSharing, setIsSharing] = React.useState(false);
  const [displayedStreak, setDisplayedStreak] = React.useState(previousStreak);
  const [encouragementKey, setEncouragementKey] = React.useState<TranslationKey>(encouragementKeys[0]);

  React.useEffect(() => {
    if (!open) return;
    setDisplayedStreak(previousStreak);
    setEncouragementKey(encouragementKeys[Math.floor(Math.random() * encouragementKeys.length)]);
    const timer = window.setTimeout(() => setDisplayedStreak(currentStreak), 450);
    return () => window.clearTimeout(timer);
  }, [currentStreak, open, previousStreak]);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const [logoImage, catImage] = await Promise.all([
        loadImageAsDataUrl('/task2goal-app-icon.png'),
        loadImageAsDataUrl(getCatImage(catColor)),
      ]);
      const blob = await createPng(buildStreakImage(
        previousStreak,
        currentStreak,
        t('streakSplashTitle'),
        t(encouragementKey),
        t('streakSplashBrand'),
        t('streakSplashTagline'),
        logoImage,
        catImage,
      ));
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
        const imageUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
        toast.info(t('streakSplashShareDownloaded'));
      }
    } catch (error) {
      console.error('Could not share streak image:', error);
      toast.error(t('streakSplashShareError'));
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="max-w-md overflow-hidden border-0 bg-[#111832] p-0 text-white shadow-2xl">
        <div className="relative overflow-hidden px-6 pb-6 pt-8 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_25%_0%,rgba(251,191,36,0.12),transparent_45%),radial-gradient(ellipse_at_100%_100%,rgba(56,189,248,0.1),transparent_45%)]" />
          <img src="/task2goal-app-icon.png" alt="" className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.045]" />
          <div className="relative">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-300/15 text-amber-300">
              <Flame className="h-5 w-5" aria-hidden="true" />
            </div>
            <DialogTitle className="text-xl font-bold text-white">{t('streakSplashTitle')}</DialogTitle>
            <DialogDescription className="mt-2 text-slate-300">{t(encouragementKey)}</DialogDescription>

            <div className="relative mx-auto my-5 flex h-44 max-w-xs items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(255,190,70,0.2),transparent_50%)]" />
              <img src={getCatImage(catColor)} alt="" className="absolute bottom-0 right-2 h-24 w-24 object-contain opacity-25" />
              <svg viewBox="0 0 180 210" className="relative h-40 w-36" role="img" aria-label="A glowing flame above a pencil">
                <defs>
                  <linearGradient id="splash-pencil" x1="0" x2="1">
                    <stop stopColor="#e88732" />
                    <stop offset=".5" stopColor="#ffd166" />
                    <stop offset="1" stopColor="#e88732" />
                  </linearGradient>
                  <linearGradient id="splash-flame" x1="0" y1="1" x2="0" y2="0">
                    <stop stopColor="#ff7b22" />
                    <stop offset=".6" stopColor="#ffd166" />
                    <stop offset="1" stopColor="#fff6bd" />
                  </linearGradient>
                </defs>
                <path d="M91 16 C57 53 88 60 67 79 C42 100 61 124 90 125 C120 126 144 102 121 76 C119 96 105 97 102 87 C127 62 108 39 91 16Z" fill="url(#splash-flame)" />
                <path d="M91 74 C75 92 79 99 68 108 C71 124 105 128 116 110 C115 101 106 96 105 89 C100 96 92 96 89 89Z" fill="#fff7d1" />
                <path d="M68 117 L112 117 L105 178 L90 201 L75 178Z" fill="url(#splash-pencil)" stroke="#ffe3a3" strokeWidth="3" />
                <path d="M75 177 L105 177 L90 201Z" fill="#f2d6a0" />
                <path d="M85 193 L95 193 L90 205Z" fill="#283248" />
                <path d="M69 130 L111 130" stroke="#fff3d2" strokeWidth="4" />
              </svg>
            </div>

            <div className="mb-6 flex items-center justify-center gap-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('streakSplashPrevious')}</p>
                <p className="mt-1 text-3xl font-black text-white">{previousStreak}</p>
              </div>
              <ArrowRight className="mt-5 h-5 w-5 text-amber-300" aria-hidden="true" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-amber-200">{t('streakSplashCurrent')}</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={displayedStreak}
                    initial={{ opacity: 0, y: 8, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.8 }}
                    transition={{ duration: 0.25 }}
                    className="mt-1 text-4xl font-black text-amber-300"
                  >
                    {displayedStreak}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            <div className="mx-auto flex max-w-xs gap-3">
              <Button className="h-11 flex-1 bg-amber-300 font-bold text-slate-950 hover:bg-amber-200" onClick={onClose}>
                {t('streakSplashContinue')}
              </Button>
              <Button variant="outline" className="h-11 gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={() => void handleShare()} disabled={isSharing}>
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
