/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CatMood, CatColor } from '../types';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface DynamicCatProps {
  mood: CatMood;
  color?: CatColor;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

const getColorStyles = (color: CatColor | undefined) => {
  switch (color) {
    case 'pink':
      return {
        fill: '#ec4899',
        stroke: '#db2777',
        tail: '#ec4899'
      };
    case 'blue':
      return {
        fill: '#3b82f6',
        stroke: '#1d4ed8',
        tail: '#3b82f6'
      };
    case 'green':
      return {
        fill: '#22c55e',
        stroke: '#15803d',
        tail: '#22c55e'
      };
    case 'purple':
      return {
        fill: '#8b5cf6',
        stroke: '#6d28d9',
        tail: '#8b5cf6'
      };
    case 'yellow':
      return {
        fill: '#fde047',
        stroke: '#f59e0b',
        tail: '#fde047'
      };
    case 'teal':
      return {
        fill: '#14b8a6',
        stroke: '#0f766e',
        tail: '#14b8a6'
      };
    case 'red':
      return {
        fill: '#ef4444',
        stroke: '#b91c1c',
        tail: '#ef4444'
      };
    case 'gray':
      return {
        fill: '#6b7280',
        stroke: '#374151',
        tail: '#6b7280'
      };
    case 'black':
      return {
        fill: '#111827',
        stroke: '#000000',
        tail: '#111827'
      };
    case 'white':
      return {
        fill: '#f8fafc',
        stroke: '#d1d5db',
        tail: '#f8fafc'
      };
    case 'orange':
    default:
      return {
        fill: '#f4d05f',
        stroke: '#d9861e',
        tail: '#f4d05f'
      };
  }
};

const CatPoses: Record<CatMood, { body: string; tilt: number; earTilt: number; eyeScale: number; mouth: string; tail: string; pawOffset: number; accessory?: string }> = {
  idle: {
    body: 'translate(0, 0)',
    tilt: 0,
    earTilt: 0,
    eyeScale: 1,
    mouth: 'M47 52 Q60 59 73 52',
    tail: 'M16 36 C 8 42, 7 56, 18 70',
    pawOffset: 0,
  },
  work: {
    body: 'translate(0, 2)',
    tilt: 0,
    earTilt: -8,
    eyeScale: 1,
    mouth: 'M47 52 Q60 58 73 52',
    tail: 'M16 37 C 8 44, 6 58, 18 72',
    pawOffset: 1,
  },
  gym: {
    body: 'translate(-2, -1)',
    tilt: 3,
    earTilt: 8,
    eyeScale: 1,
    mouth: 'M46 53 Q60 60 74 53',
    tail: 'M16 36 C 9 42, 8 58, 18 72',
    pawOffset: 2,
  },
  medical: {
    body: 'translate(0, 0)',
    tilt: 0,
    earTilt: 0,
    eyeScale: 0.9,
    mouth: 'M48 53 Q60 58 72 53',
    tail: 'M16 36 C 8 44, 7 58, 18 72',
    pawOffset: 0,
    accessory: '<path d="M35 49 L44 42 L47 49 L39 56 Z" fill="#ffffff" opacity="0.8" />'
  },
  shortBreak: {
    body: 'translate(0, 1)',
    tilt: -3,
    earTilt: -10,
    eyeScale: 1.08,
    mouth: 'M48 52 Q60 63 72 52',
    tail: 'M16 36 C 8 43, 7 58, 18 72',
    pawOffset: 0,
  },
  longBreak: {
    body: 'translate(0, 3)',
    tilt: -2,
    earTilt: -12,
    eyeScale: 1,
    mouth: 'M48 54 Q60 59 72 54',
    tail: 'M16 36 C 7 43, 6 58, 18 74',
    pawOffset: 1,
  },
  celebrating: {
    body: 'translate(0, -3)',
    tilt: 0,
    earTilt: 10,
    eyeScale: 1.1,
    mouth: 'M46 53 Q60 65 74 53',
    tail: 'M16 36 C 9 38, 7 52, 18 72',
    pawOffset: 0,
  },
  tired: {
    body: 'translate(0, 3)',
    tilt: 0,
    earTilt: -16,
    eyeScale: 0.75,
    mouth: 'M52 55 Q60 58 68 55',
    tail: 'M16 36 C 8 42, 8 58, 18 72',
    pawOffset: 1,
  },
  happy: {
    body: 'translate(-1, -1)',
    tilt: 3,
    earTilt: 6,
    eyeScale: 1.08,
    mouth: 'M46 53 Q60 64 74 53',
    tail: 'M16 36 C 8 39, 7 54, 19 72',
    pawOffset: 0,
  }
};

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-20 h-20',
  lg: 'w-24 h-24'
};

const viewBoxMap = {
  sm: '0 0 120 120',
  md: '0 0 120 120',
  lg: '0 0 120 120'
};

export const DynamicCat: React.FC<DynamicCatProps> = ({ 
  mood, 
  color = 'orange',
  size = 'md',
  className,
  onClick,
  onDoubleClick,
}) => {
  const [isClicked, setIsClicked] = React.useState(false);
  const pose = CatPoses[mood];
  const isAnimating = mood === 'gym' || mood === 'celebrating';
  const colorStyles = getColorStyles(color as CatColor);

  const handleClick = () => {
    setIsClicked(true);
    window.setTimeout(() => setIsClicked(false), 600);
    onClick?.();
  };

  return (
    <motion.div
      animate={
        isClicked
          ? { y: [0, -18, -12, 0], rotate: [0, 8, -6, 0], scale: [1, 1.06, 1] }
          : isAnimating
            ? { y: [0, -7, 0] }
            : { y: 0 }
      }
      transition={
        isClicked
          ? { duration: 0.6, type: 'spring', stiffness: 200 }
          : isAnimating
            ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut', type: 'tween' }
            : undefined
      }
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.96 }}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
      className={cn(sizeMap[size], className, 'cursor-pointer select-none')}
    >
      <svg
        viewBox={viewBoxMap[size]}
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Cat mascot"
        role="img"
      >
        <g transform={`translate(60 58) rotate(${pose.tilt})`}>
          <path d={pose.tail} fill="none" stroke={colorStyles.tail} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />

          <g transform="translate(0 8)">
            <g transform="translate(0 6)">
              <path d="M-41 28 C -42 14, -35 2, -18 -8 C -6 -15, 6 -16, 18 -9 C 35 0, 42 14, 41 28 C 41 44, 31 58, 20 68 C 11 75, 6 82, 0 82 C -6 82, -11 75, -20 68 C -31 58, -41 44, -41 28 Z" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="3.2" />

              <path d="M-31 33 C -31 24, -22 18, -14 18 C -8 18, -5 24, -5 31 C -5 38, -8 44, -14 44 C -22 44, -31 39, -31 33 Z" fill="#f5ebd0" opacity="0.8" />
              <path d="M5 33 C 5 24, 14 18, 22 18 C 28 18, 31 24, 31 31 C 31 38, 28 44, 22 44 C 14 44, 5 39, 5 33 Z" fill="#f5ebd0" opacity="0.8" />

              <path d="M-31 38 L-31 58" stroke={colorStyles.stroke} strokeWidth="3.4" strokeLinecap="round" />
              <path d="M31 38 L31 58" stroke={colorStyles.stroke} strokeWidth="3.4" strokeLinecap="round" />
              <path d="M-10 41 L-10 59" stroke={colorStyles.stroke} strokeWidth="3.4" strokeLinecap="round" />
              <path d="M10 41 L10 59" stroke={colorStyles.stroke} strokeWidth="3.4" strokeLinecap="round" />

              <path d="M-28 12 C -16 18, -8 18, 0 18 C 8 18, 16 18, 28 12" fill="none" stroke={colorStyles.stroke} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
              <path d="M-22 10 L-30 5" stroke={colorStyles.stroke} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
              <path d="M22 10 L30 5" stroke={colorStyles.stroke} strokeWidth="3" strokeLinecap="round" opacity="0.8" />

              <path d="M-36 12 C -46 2, -46 -12, -40 -22" fill="none" stroke={colorStyles.stroke} strokeWidth="3" strokeLinecap="round" />
              <path d="M36 12 C 46 2, 46 -12, 40 -22" fill="none" stroke={colorStyles.stroke} strokeWidth="3" strokeLinecap="round" />
            </g>

            <g transform="translate(0 -10)">
              <path d="M-42 8 C -45 -20, -30 -40, -8 -40 C 8 -40, 22 -38, 30 -28 C 45 -9, 42 14, 27 27 C 13 39, -13 39, -27 27 C -37 18, -42 10, -42 8 Z" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="3.2" />
              <path d="M-28 -22 L-18 -36 L-6 -20 Z" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="3" />
              <path d="M28 -22 L18 -36 L6 -20 Z" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="3" />
              <path d="M-23 -22 L-18 -30 L-11 -23 Z" fill="#f9d1c8" opacity="0.9" />
              <path d="M23 -22 L18 -30 L11 -23 Z" fill="#f9d1c8" opacity="0.9" />

              <path d="M-25 8 L-11 6 L-18 18 Z" fill={colorStyles.fill} opacity="0.6" />
              <path d="M25 8 L11 6 L18 18 Z" fill={colorStyles.fill} opacity="0.6" />

              <g transform={`scale(${pose.eyeScale})`}>
                <ellipse cx="-15" cy="10" rx="9" ry="10.5" fill="#ffffff" stroke="#1f2937" strokeWidth="2.4" />
                <ellipse cx="15" cy="10" rx="9" ry="10.5" fill="#ffffff" stroke="#1f2937" strokeWidth="2.4" />
                <circle cx="-12" cy="11" r="4.3" fill="#1f2937" />
                <circle cx="18" cy="11" r="4.3" fill="#1f2937" />
                <circle cx="-10" cy="8" r="1.5" fill="#ffffff" />
                <circle cx="20" cy="8" r="1.5" fill="#ffffff" />
              </g>

              <path d="M-6 18 Q0 23 6 18" fill="none" stroke="#2b1f1a" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M0 20 L0 25" fill="none" stroke="#2b1f1a" strokeWidth="2.1" strokeLinecap="round" />
              <path d="M-19 22 C -28 18, -31 15, -36 18" fill="none" stroke="#2b1f1a" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
              <path d="M19 22 C 28 18, 31 15, 36 18" fill="none" stroke="#2b1f1a" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
              <path d="M-9 27 C -14 30, -18 31, -24 30" fill="none" stroke="#ec9ab2" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
              <path d="M9 27 C 14 30, 18 31, 24 30" fill="none" stroke="#ec9ab2" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />

              <path d="M-40 5 C -48 1, -52 -10, -50 -20" fill="none" stroke="#2b1f1a" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              <path d="M40 5 C 48 1, 52 -10, 50 -20" fill="none" stroke="#2b1f1a" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
            </g>

            <g transform="translate(0 24)">
              <path d="M-26 8 C -27 2, -23 -5, -16 -8 C -9 -11, 8 -11, 16 -8 C 23 -5, 27 2, 26 8 C 25 18, 17 26, 0 26 C -17 26, -25 18, -26 8 Z" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="3" />
              <path d="M-18 10 L-18 20" stroke={colorStyles.stroke} strokeWidth="2.8" strokeLinecap="round" />
              <path d="M18 10 L18 20" stroke={colorStyles.stroke} strokeWidth="2.8" strokeLinecap="round" />
            </g>
          </g>

          {pose.accessory && <g dangerouslySetInnerHTML={{ __html: pose.accessory }} />}
        </g>
      </svg>
    </motion.div>
  );
};

export default DynamicCat;
