'use client';

import { motion, useSpring, useTransform, useMotionValue, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useWavelengthStore } from '@/lib/store';
import { vibeColor, vibeLabel } from '@/lib/colors';

const R = 54;
const CIRC = Math.PI * R; // half circle

export function VibeScore() {
  const vibeScore = useWavelengthStore((s) => s.vibeScore);
  const insight = useWavelengthStore((s) => s.insight);
  const analyzing = useWavelengthStore((s) => s.analyzing);

  const spring = useSpring(vibeScore, { stiffness: 60, damping: 18 });
  const dash = useTransform(spring, (v) => `${(v / 100) * CIRC} ${CIRC}`);
  const shown = useMotionValue(vibeScore);
  const [display, setDisplay] = useState(vibeScore);

  useEffect(() => {
    spring.set(vibeScore);
    const controls = animate(shown, vibeScore, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [vibeScore, spring, shown]);

  const color = vibeColor(vibeScore);

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-[128px] h-[72px]">
        <svg viewBox="0 0 128 72" className="w-full h-full overflow-visible">
          <path
            d={`M 10 64 A ${R} ${R} 0 0 1 118 64`}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <motion.path
            d={`M 10 64 A ${R} ${R} 0 0 1 118 64`}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            style={{ strokeDasharray: dash, filter: `drop-shadow(0 0 8px ${color}88)` }}
            animate={{ stroke: color }}
            transition={{ duration: 0.6 }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center leading-none">
          <span className="text-3xl font-semibold tabular-nums text-white">{display}</span>
        </div>
      </div>
      <div className="min-w-0">
        <motion.p
          key={vibeLabel(vibeScore)}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium"
          style={{ color }}
        >
          {analyzing ? 'Reading the room…' : vibeLabel(vibeScore)}
        </motion.p>
        <p className="text-xs text-[var(--muted)] leading-snug mt-0.5 line-clamp-2">
          {insight ?? 'Group vibe updates as the conversation moves.'}
        </p>
      </div>
    </div>
  );
}
