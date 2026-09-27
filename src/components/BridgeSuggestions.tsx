'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useWavelengthStore } from '@/lib/store';

export function BridgeSuggestions() {
  const suggestions = useWavelengthStore((s) => s.suggestions);
  const dismiss = useWavelengthStore((s) => s.dismissSuggestion);

  return (
    <AnimatePresence>
      {suggestions.map((s, i) => (
        <motion.div
          key={s.id}
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ type: 'spring', stiffness: 360, damping: 30, delay: i * 0.06 }}
          className="relative panel p-4"
        >
          <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--aqua)] shadow-[0_0_10px_var(--aqua)]" />
          <div className="pl-3">
            <p className="font-pixel text-[10px] tracking-wider uppercase text-[var(--aqua)]">
              {s.users.join(' and ')} on {s.topic}
            </p>
            <p className="mt-1 text-sm leading-snug text-[var(--ink)]">{s.suggestion}</p>
          </div>
          <button
            onClick={() => dismiss(s.id)}
            aria-label="Dismiss"
            className="absolute right-2 top-2 h-7 w-7 text-[var(--muted)] hover:bg-white/10 hover:text-white transition"
          >
            ×
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
