/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CatMood } from '../types';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface DynamicCatProps {
  mood: CatMood;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const CatPoses: Record<CatMood, { body: string; ears: string; eyes: string; mouth: string; accessories?: string }> = {
  idle: {
    body: 'translate(0, 0)',
    ears: 'rotate(0)',
    eyes: 'M30,35 C30,32 32,30 35,30 C38,30 40,32 40,35 M60,35 C60,32 62,30 65,30 C68,30 70,32 70,35',
    mouth: 'M50,50 Q45,55 40,50',
    accessories: ''
  },
  work: {
    body: 'translate(0, 2)',
    ears: 'rotate(-5)',
    eyes: 'M30,35 C30,32 32,30 35,30 C38,30 40,32 40,35 M60,35 C60,32 62,30 65,30 C68,30 70,32 70,35',
    mouth: 'M50,50 Q45,54 40,50 M50,50 Q55,54 60,50',
    accessories: '<circle cx="25" cy="28" r="3" fill="#FFB6C1"/><circle cx="75" cy="28" r="3" fill="#FFB6C1"/>'
  },
  gym: {
    body: 'translate(-5, -2)',
    ears: 'rotate(8)',
    eyes: 'M30,35 C30,32 32,30 35,30 C38,30 40,32 40,35 M60,35 C60,32 62,30 65,30 C68,30 70,32 70,35',
    mouth: 'M50,50 Q45,53 40,50',
    accessories: '<ellipse cx="20" cy="55" rx="4" ry="8" fill="#DEB887"/><ellipse cx="80" cy="55" rx="4" ry="8" fill="#DEB887"/><path d="M15 50 L10 40" stroke="#DEB887" stroke-width="2" fill="none"/><path d="M85 50 L90 40" stroke="#DEB887" stroke-width="2" fill="none"/>'
  },
  shortBreak: {
    body: 'translate(0, 0)',
    ears: 'rotate(-8)',
    eyes: 'M30,35 Q32,38 35,37 M65,37 Q68,38 70,35',
    mouth: 'M50,50 Q50,52 50,55',
    accessories: '<path d="M20,55 Q25,60 30,55" stroke="#FFD700" stroke-width="2" fill="none"/><path d="M70,55 Q75,60 80,55" stroke="#FFD700" stroke-width="2" fill="none"/>'
  },
  longBreak: {
    body: 'translate(2, 4)',
    ears: 'rotate(-10)',
    eyes: 'M30,36 Q32,38 35,37 M65,37 Q68,38 70,36',
    mouth: 'M50,52 Q48,56 50,58 Q52,56 50,52',
    accessories: '<path d="M25,50 Q20,55 25,60" stroke="#87CEEB" stroke-width="2" fill="none"/><path d="M75,50 Q80,55 75,60" stroke="#87CEEB" stroke-width="2" fill="none"/><text x="35" y="25" font-size="8" fill="#87CEEB">zzz</text>'
  },
  celebrating: {
    body: 'translate(0, -5)',
    ears: 'rotate(15)',
    eyes: 'M30,34 Q32,32 35,34 M70,34 Q68,32 65,34',
    mouth: 'M50,50 Q45,48 40,50 Q50,56 60,50 Q55,48 50,50',
    accessories: '<path d="M15,20 L25,10 L30,25 Z" fill="#FFD700"/><path d="M70,20 L80,10 L85,25 Z" fill="#FFD700"/><path d="M50,5 L55,15 L45,15 Z" fill="#FFD700"/>'
  },
  tired: {
    body: 'translate(0, 3)',
    ears: 'rotate(-15)',
    eyes: 'M32,36 L38,36 M65,36 L62,36',
    mouth: 'M50,52 L50,54',
    accessories: '<text x="20" y="20" font-size="12" fill="#A9A9A9">z</text><text x="75" y="15" font-size="12" fill="#A9A9A9">z</text>'
  },
  happy: {
    body: 'translate(-2, -2)',
    ears: 'rotate(5)',
    eyes: 'M30,35 C30,32 32,30 35,30 C38,30 40,32 40,35 L30,35 Z M60,35 C60,32 62,30 65,30 C68,30 70,32 70,35 L60,35 Z',
    mouth: 'M40,50 Q50,58 60,50',
    accessories: '<circle cx="50" cy="42" r="2" fill="#FFB6C1"/><circle cx="42" cy="42" r="2" fill="#FFB6C1"/><circle cx="58" cy="42" r="2" fill="#FFB6C1"/>'
  }
};

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-20 h-20',
  lg: 'w-24 h-24'
};

const viewBoxMap = {
  sm: '0 0 100 100',
  md: '0 0 100 100',
  lg: '0 0 100 100'
};

export const DynamicCat: React.FC<DynamicCatProps> = ({ 
  mood, 
  size = 'md',
  className,
  onClick
}) => {
  const [isClicked, setIsClicked] = React.useState(false);
  const pose = CatPoses[mood];
  const isAnimating = mood === 'gym' || mood === 'celebrating';

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 600);
    onClick?.();
  };

  return (
    <motion.div
      animate={
        isClicked
          ? { 
              y: [0, -20, -15, 0],
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }
          : isAnimating 
            ? { y: [0, -8, 0] }
            : { y: 0 }
      }
      transition={
        isClicked
          ? { duration: 0.6, type: 'spring', stiffness: 200 }
          : isAnimating 
            ? { duration: 0.6, repeat: Infinity, type: 'easeInOut' }
            : undefined
      }
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={cn(sizeMap[size], className, "cursor-pointer")}
    >
      <svg
        viewBox={viewBoxMap[size]}
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cat Body */}
        <g transform={`translate(50, 50) ${pose.body}`}>
          {/* Tail */}
          <motion.path
            d={mood === 'happy' ? 'M15,20 Q30,35 35,50' : 'M15,20 Q20,35 15,50'}
            stroke="#FFA500"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            animate={mood === 'happy' ? { rotate: [0, 15, 0] } : { rotate: 0 }}
            transition={mood === 'happy' ? { duration: 1, repeat: Infinity } : undefined}
          />

          {/* Body */}
          <ellipse cx="0" cy="15" rx="16" ry="20" fill="#FFA500" stroke="#FF8C00" strokeWidth="1" />

          {/* Head */}
          <circle cx="0" cy="-8" r="15" fill="#FFA500" stroke="#FF8C00" strokeWidth="1" />

          {/* Ears */}
          <motion.g
            animate={{ rotate: pose.ears }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          >
            <path d="M-8,-18 L-10,-35 L-2,-20 Z" fill="#FFA500" stroke="#FF8C00" strokeWidth="1" />
            <path d="M8,-18 L10,-35 L2,-20 Z" fill="#FFA500" stroke="#FF8C00" strokeWidth="1" />
            {/* Inner ear */}
            <path d="M-6,-22 L-8,-30 L-4,-23 Z" fill="#FFB6C1" />
            <path d="M6,-22 L8,-30 L4,-23 Z" fill="#FFB6C1" />
          </motion.g>

          {/* Eyes */}
          <motion.g
            animate={{
              scaleX: mood === 'tired' ? 0.3 : 1,
              scaleY: mood === 'tired' ? 0.1 : 1
            }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <circle cx="-5" cy="-10" r="2.5" fill="black" />
            <circle cx="5" cy="-10" r="2.5" fill="black" />
            {mood !== 'tired' && (
              <>
                <circle cx="-4.5" cy="-11" r="1" fill="white" />
                <circle cx="5.5" cy="-11" r="1" fill="white" />
              </>
            )}
          </motion.g>

          {/* Nose */}
          <path d="M0,-5 L-1,0 L1,0 Z" fill="#FFB6C1" />

          {/* Mouth */}
          <motion.path
            d={pose.mouth}
            stroke="#000"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            animate={mood === 'celebrating' ? { scale: [1, 1.1, 1] } : { scale: 1 }}
            transition={mood === 'celebrating' ? { duration: 0.8, repeat: Infinity } : undefined}
          />

          {/* Whiskers */}
          <line x1="-16" y1="-8" x2="-25" y2="-10" stroke="#000" strokeWidth="0.8" />
          <line x1="-16" y1="-3" x2="-25" y2="-3" stroke="#000" strokeWidth="0.8" />
          <line x1="-16" y1="2" x2="-25" y2="4" stroke="#000" strokeWidth="0.8" />
          <line x1="16" y1="-8" x2="25" y2="-10" stroke="#000" strokeWidth="0.8" />
          <line x1="16" y1="-3" x2="25" y2="-3" stroke="#000" strokeWidth="0.8" />
          <line x1="16" y1="2" x2="25" y2="4" stroke="#000" strokeWidth="0.8" />

          {/* Front Paws */}
          <ellipse cx="-8" cy="30" rx="5" ry="8" fill="#FFA500" stroke="#FF8C00" strokeWidth="1" />
          <ellipse cx="8" cy="30" rx="5" ry="8" fill="#FFA500" stroke="#FF8C00" strokeWidth="1" />

          {/* Accessories for special moods */}
          {pose.accessories && (
            <g dangerouslySetInnerHTML={{ __html: pose.accessories }} />
          )}
        </g>
      </svg>
    </motion.div>
  );
};

export default DynamicCat;
