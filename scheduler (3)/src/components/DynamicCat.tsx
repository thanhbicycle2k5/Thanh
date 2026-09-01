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

          <g transform="translate(0 8)">
            <path d="M-10 18 C -18 8, -25 4, -30 8 C -35 12, -34 24, -30 30 C -23 39, -11 40, -6 34 C -1 28, 1 22, -10 18 Z" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="2.4" />

            <path d="M-12 18 C -18 14, -22 4, -18 -8 C -14 -18, -6 -24, 1 -24 C 10 -24, 18 -18, 18 -8 C 21 1, 17 10, 7 18 C 4 21, 3 23, 0 24 C -6 25, -10 22, -12 18 Z" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="2.4" />

            <g transform={`rotate(${pose.earTilt})`}>
              <path d="M-12 -18 L-22 -39 L-3 -23 Z" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="2" />
              <path d="M12 -18 L22 -39 L3 -23 Z" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="2" />
              <path d="M-9 -20 L-16 -31 L-4 -25 Z" fill="#fbb4c9" opacity="0.9" />
              <path d="M9 -20 L16 -31 L4 -25 Z" fill="#fbb4c9" opacity="0.9" />
            </g>

            <g transform={`scale(${pose.eyeScale})`}>
              <ellipse cx="-8" cy="-2" rx="4.2" ry="5.2" fill="#111827" />
              <ellipse cx="8" cy="-2" rx="4.2" ry="5.2" fill="#111827" />
              <circle cx="-6.2" cy="-3.8" r="1.4" fill="#ffffff" />
              <circle cx="9.8" cy="-3.8" r="1.4" fill="#ffffff" />
            </g>

            <path d="M0 7 L6 12 L12 7" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M0 7 L-6 12 L-12 7" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M0 10 L0 15" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" />

            <path d="M-18 2 L-30 1" stroke="#111827" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M-18 7 L-30 8" stroke="#111827" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M-18 12 L-30 15" stroke="#111827" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M18 2 L30 1" stroke="#111827" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M18 7 L30 8" stroke="#111827" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M18 12 L30 15" stroke="#111827" strokeWidth="1.7" strokeLinecap="round" />
          </g>

          <g transform="translate(0 18)">
            <path d="M-14 14 C -16 3, -13 -2, -8 0 C -5 2, -6 9, -8 15 L -14 14 Z" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="2" />
            <path d="M14 14 C 16 3, 13 -2, 8 0 C 5 2, 6 9, 8 15 L 14 14 Z" fill={colorStyles.fill} stroke={colorStyles.stroke} strokeWidth="2" />
            <path d="M-15 18 L-19 30" stroke={colorStyles.stroke} strokeWidth="2.6" strokeLinecap="round" />
            <path d="M15 18 L19 30" stroke={colorStyles.stroke} strokeWidth="2.6" strokeLinecap="round" />
            <path d="M-6 22 L-10 32" stroke={colorStyles.stroke} strokeWidth="2.6" strokeLinecap="round" />
            <path d="M6 22 L10 32" stroke={colorStyles.stroke} strokeWidth="2.6" strokeLinecap="round" />
            <path d="M-18 18 L-24 24" stroke={colorStyles.stroke} strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
            <path d="M18 18 L24 24" stroke={colorStyles.stroke} strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
          </g>

          {pose.accessory && <g dangerouslySetInnerHTML={{ __html: pose.accessory }} />}
        </g>
      </svg>
    </motion.div>
  );
};

export default DynamicCat;
