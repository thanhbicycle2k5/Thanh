/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface Particle {
  id: string;
  x: number;
  y: number;
  delay: number;
}

interface CelebrationEffectProps {
  trigger: boolean;
  count?: number;
}

export const CelebrationEffect: React.FC<CelebrationEffectProps> = ({ trigger, count = 20 }) => {
  const [particles, setParticles] = React.useState<Particle[]>([]);

  React.useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: count }).map((_, i) => ({
        id: `particle-${Date.now()}-${i}`,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        delay: i * 0.05,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [trigger, count]);

  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{ 
            opacity: 0, 
            x: particle.x, 
            y: particle.y + 100,
            scale: 0,
            rotate: Math.random() * 360
          }}
          transition={{ duration: 1.5, delay: particle.delay }}
          className="fixed pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            width: '8px',
            height: '8px',
            marginLeft: '-4px',
            marginTop: '-4px',
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181'][
                Math.floor(Math.random() * 5)
              ],
            }}
          />
        </motion.div>
      ))}
    </>
  );
};

export default CelebrationEffect;
