'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

interface QRPanelProps {
  roomId: string;
  open: boolean;
  onClose: () => void;
}

export function QRPanel({ roomId, open, onClose }: QRPanelProps) {
  // Only rendered after a click, so window is always defined when this matters.
  const url = open && typeof window !== 'undefined' ? `${window.location.origin}/room/${roomId}` : '';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/80 backdrop-blur-md p-6"
        >
          <motion.div
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-[var(--surface)] ring-1 ring-white/10 p-8 text-center"
          >
            <p className="text-sm text-[var(--muted)]">Scan to join this room</p>
            <div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-4">
              {url && <QRCodeSVG value={url} size={224} level="M" marginSize={0} />}
            </div>
            <p className="mt-6 text-4xl font-semibold tracking-[0.3em] text-white tabular-nums">{roomId}</p>
            <p className="mt-2 text-xs text-[var(--muted)] break-all">{url.replace(/^https?:\/\//, '')}</p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-white/5 hover:bg-white/10 py-3 text-sm text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              Back to the room
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
