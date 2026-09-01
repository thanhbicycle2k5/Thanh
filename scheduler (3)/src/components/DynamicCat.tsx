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

          <g transform="translate(0 10)">
            <ellipse cx="0" cy="28" rx="34" ry="30" fill="#f4d05f" stroke="#d9881e" strokeWidth="3" />
            <ellipse cx="0" cy="-6" rx="40" ry="35" fill="#f4d05f" stroke="#d9881e" strokeWidth="3" />

            <path d="M-32 -18 L-18 -42 L-4 -18 Z" fill="#f4d05f" stroke="#d9881e" strokeWidth="3" />
            <path d="M32 -18 L18 -42 L4 -18 Z" fill="#f4d05f" stroke="#d9881e" strokeWidth="3" />
            <path d="M-26 -28 L-16 -35 L-8 -22 Z" fill="#f7c3b8" opacity="0.9" />
            <path d="M26 -28 L16 -35 L8 -22 Z" fill="#f7c3b8" opacity="0.9" />

            <path d="M-20 -7 L-7 -12 L-18 -1 Z" fill="#e6ad32" opacity="0.9" />
            <path d="M20 -7 L7 -12 L18 -1 Z" fill="#e6ad32" opacity="0.9" />
            <path d="M-8 0 L0 -10 L8 0" fill="#f4d05f" stroke="#d9881e" strokeWidth="2" />
            <path d="M-8 12 Q0 17 8 12" fill="none" stroke="#2b1f1a" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M-1 15 L0 20 L1 15" fill="none" stroke="#2b1f1a" strokeWidth="2" strokeLinecap="round" />

            <g transform={`scale(${pose.eyeScale})`}>
              <ellipse cx="-14" cy="2" rx="8" ry="9.5" fill="#fff" stroke="#1f2937" strokeWidth="2" />
              <ellipse cx="14" cy="2" rx="8" ry="9.5" fill="#fff" stroke="#1f2937" strokeWidth="2" />
              <circle cx="-11" cy="2" r="4" fill="#1f2937" />
              <circle cx="17" cy="2" r="4" fill="#1f2937" />
              <circle cx="-9" cy="-1" r="1.4" fill="#fff" />
              <circle cx="19" cy="-1" r="1.4" fill="#fff" />
            </g>

            <path d="M-6 10 Q0 14 6 10" fill="none" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M0 11 Q0 15 0 18" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
            <path d="M-18 23 C -26 18, -31 16, -38 18" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <path d="M18 23 C 26 18, 31 16, 38 18" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <path d="M-33 12 C -40 12, -43 8, -43 2" fill="none" stroke="#111827" strokeWidth="1.7" strokeLinecap="round" opacity="0.8" />
            <path d="M33 12 C 40 12, 43 8, 43 2" fill="none" stroke="#111827" strokeWidth="1.7" strokeLinecap="round" opacity="0.8" />
            <path d="M-19 17 C -24 14, -29 14, -34 17" fill="none" stroke="#111827" strokeWidth="1.7" strokeLinecap="round" opacity="0.8" />
            <path d="M19 17 C 24 14, 29 14, 34 17" fill="none" stroke="#111827" strokeWidth="1.7" strokeLinecap="round" opacity="0.8" />

            <g transform="translate(0 30)">
              <path d="M-18 8 C -22 0, -22 -10, -14 -14 C -7 -18, 7 -18, 14 -14 C 22 -10, 22 0, 18 8 L 14 18 C 6 12, -6 12, -14 18 Z" fill="#f4d05f" stroke="#d9881e" strokeWidth="3" />
              <path d="M-16 18 L-18 32" stroke="#d9881e" strokeWidth="3" strokeLinecap="round" />
              <path d="M16 18 L18 32" stroke="#d9881e" strokeWidth="3" strokeLinecap="round" />
              <path d="M-7 19 L-9 33" stroke="#d9881e" strokeWidth="3" strokeLinecap="round" />
              <path d="M7 19 L9 33" stroke="#d9881e" strokeWidth="3" strokeLinecap="round" />
              <path d="M-25 18 C -32 8, -33 14, -33 25" fill="none" stroke="#d9881e" strokeWidth="3" strokeLinecap="round" />
              <path d="M25 18 C 32 8, 33 14, 33 25" fill="none" stroke="#d9881e" strokeWidth="3" strokeLinecap="round" />
            </g>
          </g>

          {pose.accessory && <g dangerouslySetInnerHTML={{ __html: pose.accessory }} />}
        </g>
      </svg>
    </motion.div>
  );
};

export default DynamicCat;
