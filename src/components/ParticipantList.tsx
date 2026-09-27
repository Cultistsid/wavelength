'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useWavelengthStore } from '@/lib/store';

export function ParticipantList() {
  const users = useWavelengthStore((s) => s.users);
  const currentUser = useWavelengthStore((s) => s.currentUser);

  return (
    <div className="flex flex-wrap items-center gap-2 min-h-8">
      <span className="text-xs text-[var(--muted)] mr-1">
        {users.length} in the room
      </span>
      <AnimatePresence>
        {users.map((u) => (
          <motion.span
            key={u.id}
            layout
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] ring-1 ring-white/10 px-2.5 py-1 text-xs text-[var(--ink)]"
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: u.color }} />
            {u.name}
            {u.id === currentUser?.id && <span className="text-[var(--muted)]">you</span>}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
