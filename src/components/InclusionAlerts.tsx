'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useWavelengthStore } from '@/lib/store';

const headline: Record<'quiet' | 'excluded' | 'dominant', (name: string) => string> = {
  quiet: (n) => `${n} has been quiet`,
  excluded: (n) => `${n} could use a way in`,
  dominant: (n) => `${n} is carrying the conversation`,
};

export function InclusionAlerts() {
  const alerts = useWavelengthStore((s) => s.alerts);
  const dismiss = useWavelengthStore((s) => s.dismissAlert);

  return (
    <AnimatePresence>
      {alerts.map((a, i) => (
        <motion.div
          key={a.id}
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ type: 'spring', stiffness: 360, damping: 30, delay: i * 0.06 }}
          className="relative rounded-2xl bg-[var(--surface)] ring-1 ring-[var(--amber)]/30 p-4"
        >
          <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full bg-[var(--amber)]" />
          <div className="pl-3">
            <p className="text-xs text-[var(--amber)]">{headline[a.type](a.userName)}</p>
            <p className="mt-1 text-sm leading-snug text-[var(--ink)]">{a.message}</p>
          </div>
          <button
            onClick={() => dismiss(a.id)}
            aria-label="Dismiss"
            className="absolute right-2 top-2 h-7 w-7 rounded-full text-[var(--muted)] hover:bg-white/10 hover:text-white transition"
          >
            ×
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
