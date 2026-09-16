/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BackgroundConfig, BackgroundType, Theme } from '../types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackgroundCustomizerProps {
  config: BackgroundConfig | undefined;
  onChange: (config: BackgroundConfig | undefined) => void;
  boardOpacity: number;
  onBoardOpacityChange: (opacity: number) => void;
  t: (key: string) => string;
  theme: Theme;
}

const PRESET_COLORS = [
  '#FFFFFF',
  '#F3F4F6',
  '#E5E7EB',
  '#D1D5DB',
  '#6B7280',
  '#374151',
  '#1F2937',
  '#111827',
  '#FEE2E2',
  '#FED7AA',
  '#FEF08A',
  '#DCFCE7',
  '#CEE7F3',
  '#E9D5FF',
  '#FCE7F3',
];

const PRESET_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
];

const MAX_BACKGROUND_IMAGE_BYTES = 600_000;
const MAX_BACKGROUND_IMAGE_DIMENSION = 1600;

const compressBackgroundImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read background image'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Unable to decode background image'));
      image.onload = () => {
        const scale = Math.min(
          1,
          MAX_BACKGROUND_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight)
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Unable to process background image'));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const qualities = [0.82, 0.68, 0.55];
        let result = canvas.toDataURL('image/jpeg', qualities[qualities.length - 1]);
        for (const quality of qualities) {
          const candidate = canvas.toDataURL('image/jpeg', quality);
          result = candidate;
          if (candidate.length <= MAX_BACKGROUND_IMAGE_BYTES) break;
        }
        resolve(result);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
};

export const BackgroundCustomizer: React.FC<BackgroundCustomizerProps> = ({
  config,
  onChange,
  boardOpacity,
  onBoardOpacityChange,
  t,
  theme,
}) => {
  const [type, setType] = React.useState<BackgroundType>(config?.type || 'color');
  const [value, setValue] = React.useState<string>(config?.value || '#FFFFFF');
  const [opacity, setOpacity] = React.useState<number>(
    Number.isFinite(config?.opacity) ? Math.min(1, Math.max(0, config?.opacity ?? 1)) : 1
  );
  const [nextBoardOpacity, setNextBoardOpacity] = React.useState<number>(
    Number.isFinite(boardOpacity) ? Math.min(1, Math.max(0, boardOpacity)) : 1
  );
  const safeOpacity = Number.isFinite(opacity) ? Math.min(1, Math.max(0, opacity)) : 1;
  const safeBoardOpacity = Number.isFinite(nextBoardOpacity)
    ? Math.min(1, Math.max(0, nextBoardOpacity))
    : 1;
  const previewEmptyBackground = 'transparent';

  React.useEffect(() => {
    setNextBoardOpacity(Number.isFinite(boardOpacity) ? Math.min(1, Math.max(0, boardOpacity)) : 1);
  }, [boardOpacity]);

  const handleTypeChange = (newType: BackgroundType) => {
    setType(newType);
    if (newType === 'color') {
      setValue('#FFFFFF');
    } else if (newType === 'gradient') {
      setValue(PRESET_GRADIENTS[0]);
    } else if (newType === 'image') {
      setValue('');
    }
  };

  const handleSave = () => {
    if (value) {
      onChange({
        type,
        value,
        opacity: safeOpacity,
      });
    }
    onBoardOpacityChange(safeBoardOpacity);
  };

  const handleClear = () => {
    onChange(undefined);
    setType('color');
    setValue('#FFFFFF');
    setOpacity(1);
    setNextBoardOpacity(1);
    onBoardOpacityChange(1);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void compressBackgroundImage(file)
        .then(setValue)
        .catch((error) => {
          console.error('Unable to prepare background image:', error);
        });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-[10px] font-bold uppercase tracking-wider opacity-50">
          {t('background')}
        </Label>
        {config && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[9px]"
            onClick={handleClear}
          >
            Reset
          </Button>
        )}
      </div>

      {/* Type Selection */}
      <div className="space-y-2">
        <Label className="text-xs">{t('backgroundType')}</Label>
        <Select value={type} onValueChange={(v: BackgroundType) => handleTypeChange(v)}>
          <SelectTrigger className="text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="color">{t('backgroundColor')}</SelectItem>
            <SelectItem value="gradient">{t('backgroundGradient')}</SelectItem>
            <SelectItem value="image">{t('backgroundImage')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Color Picker */}
      {type === 'color' && (
        <div className="space-y-2">
          <Label className="text-xs">{t('backgroundColor')}</Label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border border-border"
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="text-xs h-8"
              placeholder="#FFFFFF"
            />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => setValue(color)}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gradient Picker */}
      {type === 'gradient' && (
        <div className="space-y-2">
          <Label className="text-xs">{t('backgroundGradient')}</Label>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_GRADIENTS.map((gradient, idx) => (
              <button
                key={idx}
                className={cn(
                  'w-full h-12 rounded border-2 transition-all hover:scale-105',
                  value === gradient ? 'border-[#107C41]' : 'border-border'
                )}
                style={{ background: gradient }}
                onClick={() => setValue(gradient)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Image Picker */}
      {type === 'image' && (
        <div className="space-y-2">
          <Label className="text-xs">{t('uploadBackgroundImage')}</Label>
          <div className="relative">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-xs"
            />
            {value && (
              <div className="mt-2 relative w-full h-20 rounded border border-border overflow-hidden">
                <img
                  src={value}
                  alt="Background preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Opacity Slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-xs">{t('backgroundOpacity')}</Label>
          <span className="text-xs font-bold">{Math.round(safeOpacity * 100)}%</span>
        </div>
        <Slider
          value={[safeOpacity]}
          onValueChange={(v) => {
            const nextValue = Array.isArray(v) ? v[0] : v;
            if (typeof nextValue === 'number' && Number.isFinite(nextValue)) {
              setOpacity(nextValue);
            }
          }}
          min={0}
          max={1}
          step={0.1}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-xs">{t('boardOpacity')}</Label>
          <span className="text-xs font-bold">{Math.round(safeBoardOpacity * 100)}%</span>
        </div>
        <Slider
          value={[safeBoardOpacity]}
          onValueChange={(v) => {
            const nextValue = Array.isArray(v) ? v[0] : v;
            if (typeof nextValue === 'number' && Number.isFinite(nextValue)) {
              setNextBoardOpacity(nextValue);
              onBoardOpacityChange(nextValue);
            }
          }}
          min={0}
          max={1}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Preview */}
      <div className="relative w-full h-28 rounded border border-border overflow-hidden bg-background">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={
            type === 'image'
              ? { backgroundImage: value ? `url(${value})` : undefined, opacity: safeOpacity }
              : type === 'gradient'
                ? { background: value, opacity: safeOpacity }
                : { backgroundColor: value, opacity: safeOpacity }
          }
        />
        <div
          className="absolute inset-3 rounded border border-border p-2 shadow-sm"
          style={{
            backgroundColor: `color-mix(in srgb, var(--card) ${Math.max(12, safeBoardOpacity * 100)}%, transparent)`,
          }}
        >
          <div className="mb-2 h-2 w-1/3 rounded" style={{ backgroundColor: previewEmptyBackground }} />
          <div className="grid grid-cols-4 gap-1">
            {[
              '#92D050',
              '#FFFF00',
              '#FF0000',
              '#0070C0',
              '#FF69B4',
              null,
              null,
              null,
            ].map((color, index) => (
              <div
                key={index}
                className="h-5 rounded-sm border border-border"
                style={{
                  backgroundColor: color || previewEmptyBackground,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button
        className="w-full bg-[#107C41] hover:bg-[#0d6435] text-white text-xs h-8"
        onClick={handleSave}
      >
        {t('save')}
      </Button>
    </div>
  );
};

export default BackgroundCustomizer;
