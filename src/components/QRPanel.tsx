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
            className="w-full max-w-sm panel p-8 text-center"
          >
            <p className="font-pixel text-[10px] tracking-wider text-[var(--muted)]">SCAN TO JOIN</p>
            <div className="mx-auto mt-5 w-fit bg-white p-4 shadow-[0_0_40px_rgba(242,233,78,0.25)]">
              {url && <QRCodeSVG value={url} size={224} level="M" marginSize={0} />}
            </div>
            <p className="mt-6 font-pixel text-3xl tracking-[0.2em] glow-accent">{roomId}</p>
            <p className="mt-2 text-xs text-[var(--muted)] break-all">{url.replace(/^https?:\/\//, '')}</p>
            <button
              onClick={onClose}
              className="btn-outline mt-6 w-full font-pixel text-[11px] tracking-wider py-3"
            >
              BACK TO THE ROOM
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
