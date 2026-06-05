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

export const BackgroundCustomizer: React.FC<BackgroundCustomizerProps> = ({
  config,
  onChange,
  t,
  theme,
}) => {
  const [type, setType] = React.useState<BackgroundType>(config?.type || 'color');
  const [value, setValue] = React.useState<string>(config?.value || '#FFFFFF');
  const [opacity, setOpacity] = React.useState<number>(config?.opacity ?? 1);

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
        opacity,
      });
    }
  };

  const handleClear = () => {
    onChange(undefined);
    setType('color');
    setValue('#FFFFFF');
    setOpacity(1);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setValue(dataUrl);
      };
      reader.readAsDataURL(file);
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
          <span className="text-xs font-bold">{Math.round(opacity * 100)}%</span>
        </div>
        <Slider
          value={[opacity]}
          onValueChange={(v) => setOpacity(v[0])}
          min={0}
          max={1}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Preview */}
      <div
        className="w-full h-20 rounded border border-border overflow-hidden"
        style={
          type === 'gradient'
            ? { background: value, opacity }
            : { backgroundColor: value, opacity }
        }
      >
        {type === 'image' && value && (
          <img src={value} alt="preview" className="w-full h-full object-cover" />
        )}
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
