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
        fill: '#f59e0b',
        stroke: '#ff8c00',
        tail: '#f59e0b'
      };
  }
};

const CatPoses: Record<CatMood, { body: string; tilt: number; earTilt: number; eyeScale: number; mouth: string; tail: string; pawOffset: number; accessory?: string }> = {
  idle: {
    body: 'translate(0, 0)',
    tilt: 0,
    earTilt: 0,
    eyeScale: 1,
    mouth: 'M48 52 Q60 60 72 52',
    tail: 'M20 40 C 8 54, 8 76, 23 82',
    pawOffset: 0,
  },
  work: {
    body: 'translate(0, 2)',
    tilt: -2,
    earTilt: -8,
    eyeScale: 1,
    mouth: 'M47 52 Q60 57 73 52',
    tail: 'M18 42 C 8 52, 6 68, 18 79',
    pawOffset: 1,
  },
  gym: {
    body: 'translate(-3, -1)',
    tilt: 6,
    earTilt: 8,
    eyeScale: 1,
    mouth: 'M46 52 Q60 58 74 52',
    tail: 'M20 41 C 9 49, 6 63, 18 80',
    pawOffset: 2,
  },
  medical: {
    body: 'translate(0, 0)',
    tilt: 0,
    earTilt: 0,
    eyeScale: 0.9,
    mouth: 'M47 52 Q60 54 73 52',
    tail: 'M18 42 C 8 55, 7 72, 22 82',
    pawOffset: 0,
    accessory: '<path d="M34 48 L43 42 L46 48 L38 55 Z" fill="#ffffff" opacity="0.8" />'
  },
  shortBreak: {
    body: 'translate(0, 1)',
    tilt: -4,
    earTilt: -10,
    eyeScale: 1.08,
    mouth: 'M48 51 Q60 65 72 51',
    tail: 'M20 40 C 10 50, 8 68, 18 80',
    pawOffset: 0,
  },
  longBreak: {
    body: 'translate(0, 4)',
    tilt: -3,
    earTilt: -12,
    eyeScale: 1,
    mouth: 'M49 53 Q60 58 71 53',
    tail: 'M18 42 C 7 52, 6 70, 20 84',
    pawOffset: 1,
  },
  celebrating: {
    body: 'translate(0, -5)',
    tilt: 0,
    earTilt: 12,
    eyeScale: 1.1,
    mouth: 'M46 52 Q60 66 74 52',
    tail: 'M20 40 C 11 38, 7 54, 18 78',
    pawOffset: 0,
  },
  tired: {
    body: 'translate(0, 3)',
    tilt: 0,
    earTilt: -16,
    eyeScale: 0.75,
    mouth: 'M52 55 Q60 58 68 55',
    tail: 'M20 41 C 8 54, 8 74, 21 84',
    pawOffset: 1,
  },
  happy: {
    body: 'translate(-2, -1)',
    tilt: 3,
    earTilt: 6,
    eyeScale: 1.08,
    mouth: 'M46 52 Q60 64 74 52',
    tail: 'M18 40 C 8 46, 7 62, 21 81',
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
  onClick
}) => {
  const [isClicked, setIsClicked] = React.useState(false);
  const pose = CatPoses[mood];
  const isAnimating = mood === 'gym' || mood === 'celebrating';
  const colorStyles = getColorStyles(color);

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

          <ellipse cx="0" cy="18" rx="24" ry="18" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="2.5" />

          <g transform={`translate(0 -8)`}>
            <circle cx="0" cy="0" r="23" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="2.5" />

            <g transform={`rotate(${pose.earTilt})`}>
              <path d="M-12 -18 L-23 -40 L-3 -23 Z" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="2" />
              <path d="M12 -18 L23 -40 L3 -23 Z" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="2" />
              <path d="M-9 -20 L-17 -31 L-5 -24 Z" fill="#fbb4c9" opacity="0.9" />
              <path d="M9 -20 L17 -31 L5 -24 Z" fill="#fbb4c9" opacity="0.9" />
            </g>

            <g transform={`scale(${pose.eyeScale})`}>
              <ellipse cx="-8" cy="-2" rx="5" ry="6" fill="#111827" />
              <ellipse cx="8" cy="-2" rx="5" ry="6" fill="#111827" />
              <circle cx="-6" cy="-4" r="1.7" fill="#ffffff" />
              <circle cx="10" cy="-4" r="1.7" fill="#ffffff" />
            </g>

            <path d="M0 6 L6 12 L12 6" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M0 7 L-6 12 L-12 7" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M0 10 L0 15" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" />

            <path d="M0 0 L0 5" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
            <path d="M-18 2 L-31 0" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M-18 7 L-31 8" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M-18 12 L-31 16" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M18 2 L31 0" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M18 7 L31 8" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M18 12 L31 16" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          <g>
            <ellipse cx="-15" cy="34" rx="7" ry="12" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="2" />
            <ellipse cx="15" cy="34" rx="7" ry="12" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="2" />
            <ellipse cx="-13" cy="49" rx="5" ry="7" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="2" />
            <ellipse cx="13" cy="49" rx="5" ry="7" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="2" />
            <path d="M-24 35 L-30 42" stroke={colorStyles.stroke} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <path d="M24 35 L30 42" stroke={colorStyles.stroke} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          </g>

          {pose.accessory && <g dangerouslySetInnerHTML={{ __html: pose.accessory }} />}
        </g>
      </svg>
    </motion.div>
  );
};

export default DynamicCat;
