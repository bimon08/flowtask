'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Particle config ────────────────────────────────────── */

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  size: number;
  color: string;
  delay: number;
}

const COLORS_SMALL = ['#D71921', '#ffffff', '#666666', '#D71921', '#ffffff'];
const COLORS_BIG   = ['#D71921', '#ffffff', '#999999', '#D71921', '#ffffff', '#00ff66', '#D71921'];

function generateParticles(count: number, variant: 'small' | 'big'): Particle[] {
  const colors = variant === 'big' ? COLORS_BIG : COLORS_SMALL;
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const distance = variant === 'big'
      ? 80 + Math.random() * 180
      : 40 + Math.random() * 80;

    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - (variant === 'big' ? 60 : 20), // upward bias (gravity feel)
      rotation: Math.random() * 720 - 360,
      size: variant === 'big' ? 4 + Math.random() * 5 : 3 + Math.random() * 3,
      color: colors[i % colors.length],
      delay: Math.random() * 0.08,
    };
  });
}

/* ─── ConfettiBurst Component ────────────────────────────── */

interface ConfettiBurstProps {
  /** 'small' for task completion, 'big' for commitment completion */
  variant?: 'small' | 'big';
  /** Trigger key — change this to fire a new burst */
  triggerKey: number;
}

export default function ConfettiBurst({ variant = 'small', triggerKey }: ConfettiBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (triggerKey === 0) return;
    const count = variant === 'big' ? 40 : 24;
    setParticles(generateParticles(count, variant));
    setActive(true);

    const timeout = setTimeout(() => {
      setActive(false);
    }, variant === 'big' ? 1200 : 800);

    return () => clearTimeout(timeout);
  }, [triggerKey, variant]);

  return (
    <AnimatePresence>
      {active && (
        <div className="pointer-events-none absolute inset-0 z-50 overflow-visible">
          {particles.map((p) => (
            <motion.div
              key={`${triggerKey}-${p.id}`}
              initial={{
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                rotate: 0,
              }}
              animate={{
                opacity: 0,
                x: p.x,
                y: p.y,
                scale: 0.2,
                rotate: p.rotation,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: variant === 'big' ? 0.9 : 0.6,
                delay: p.delay,
                ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
              }}
              className="absolute left-1/2 top-1/2"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                marginLeft: -p.size / 2,
                marginTop: -p.size / 2,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
