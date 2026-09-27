'use client';

import { motion, useSpring, useTransform, useMotionValue, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useWavelengthStore } from '@/lib/store';
import { vibeColor, vibeLabel } from '@/lib/colors';

const R = 54;
const CIRC = Math.PI * R;

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
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [vibeScore, spring, shown]);

  const color = vibeColor(vibeScore);

  return (
    <div className="flex items-center gap-5">
      <div className="relative w-[136px] h-[76px] shrink-0">
        <svg viewBox="0 0 128 72" className="w-full h-full overflow-visible">
          <path d={`M 10 64 A ${R} ${R} 0 0 1 118 64`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <motion.path
            d={`M 10 64 A ${R} ${R} 0 0 1 118 64`}
            fill="none"
            stroke={color}
            strokeWidth="8"
            style={{ strokeDasharray: dash, filter: `drop-shadow(0 0 10px ${color})` }}
            animate={{ stroke: color }}
            transition={{ duration: 0.6 }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center leading-none">
          <span className="font-pixel text-3xl text-white glow-white tabular-nums">{display}</span>
        </div>
      </div>
      <div className="min-w-0">
        <motion.p
          key={analyzing ? 'reading' : vibeLabel(vibeScore)}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-pixel text-[11px] tracking-wider uppercase"
          style={{ color, textShadow: `0 0 12px ${color}88` }}
        >
          {analyzing ? 'Reading the room' : vibeLabel(vibeScore)}
          {analyzing && <span className="caret">_</span>}
        </motion.p>
        <p className="text-sm text-[var(--muted)] leading-snug mt-1 line-clamp-2">
          {insight ?? 'Group vibe updates as the conversation moves.'}
        </p>
      </div>
    </div>
  );
}
