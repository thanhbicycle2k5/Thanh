/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface Particle {
  id: string;
  x: number;
  y: number;
  delay: number;
  color: string;
  rotation: number;
  size: number;
  type: 'confetti' | 'flower' | 'sparkle';
}

interface CelebrationEffectProps {
  trigger: number;
  count?: number;
}

export const CelebrationEffect: React.FC<CelebrationEffectProps> = ({ trigger, count = 20 }) => {
  const [particles, setParticles] = React.useState<Particle[]>([]);
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (trigger === 0) return;

    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#A78BFA'];
    const newParticles = Array.from({ length: count }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 180;

      return {
        id: `particle-${trigger}-${i}`,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        delay: i * 0.015,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 540 - 270,
        size: 7 + Math.random() * 9,
        type: i % 9 === 0 ? 'flower' as const : i % 7 === 0 ? 'sparkle' as const : 'confetti' as const,
      };
    });
    setParticles(newParticles);

    const timer = window.setTimeout(() => setParticles([]), 2400);
    return () => window.clearTimeout(timer);
  }, [trigger, count]);

  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            opacity: 0,
            x: prefersReducedMotion ? particle.x : 0,
            y: prefersReducedMotion ? particle.y + 100 : 0,
            scale: 0.2,
          }}
          animate={prefersReducedMotion ? {
            opacity: [0, 1, 0],
            scale: [0.8, 1, 0.8],
          } : {
            opacity: [0, 1, 1, 0],
            x: particle.x,
            y: particle.y + 100,
            scale: particle.type === 'flower' ? [0.2, 1.3, 0.9] : [0.5, 1, 0.2],
            rotate: particle.rotation,
          }}
          transition={{ duration: prefersReducedMotion ? 0.7 : 1.8, delay: particle.delay, ease: 'easeOut' }}
          className="fixed left-1/2 top-1/2 z-[100] pointer-events-none"
          aria-hidden="true"
          style={{
            width: particle.type === 'confetti' ? `${particle.size * 0.65}px` : `${particle.size * 2}px`,
            height: particle.type === 'confetti' ? `${particle.size * 1.3}px` : `${particle.size * 2}px`,
          }}
        >
          {particle.type === 'flower' ? (
            <span className="block text-center leading-none" style={{ fontSize: `${particle.size * 2}px` }}>🌸</span>
          ) : particle.type === 'sparkle' ? (
            <span className="block text-center leading-none" style={{ color: particle.color, fontSize: `${particle.size * 1.7}px` }}>✦</span>
          ) : (
            <span className="block h-full w-full rounded-sm" style={{ backgroundColor: particle.color }} />
          )}
        </motion.div>
      ))}
    </>
  );
};

export default CelebrationEffect;
