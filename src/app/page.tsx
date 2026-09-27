'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { WaveField } from '@/components/WaveField';

const newRoomId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length >= 4) router.push(`/room/${code.trim().toUpperCase()}`);
  };

  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden scanlines">
      <WaveField energy={0.45} className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[60vh] w-full opacity-60 pointer-events-none" />

      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-6">
        <span className="font-pixel text-sm tracking-wider text-[var(--accent)]">WAVELENGTH</span>
        <span className="font-pixel text-[10px] tracking-wider text-[var(--muted)]">META HACKATHON 2026</span>
      </header>

      <section className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-10 pb-16 max-w-5xl">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-[15vw] sm:text-[9vw] lg:text-[112px] font-semibold leading-[0.92] tracking-[-0.04em]"
        >
          Find the room&apos;s
          <br />
          <span className="glow-accent">frequency.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 max-w-md text-lg text-[var(--muted)] leading-relaxed"
        >
          A group chat that watches itself. Live AI shows who is clicking, what they share,
          and who could use a way in.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex flex-col sm:flex-row gap-3 sm:items-stretch"
        >
          <button
            onClick={() => router.push(`/room/${newRoomId()}`)}
            className="btn-outline font-pixel text-sm tracking-wider px-7 py-4"
          >
            <span className="caret mr-2">▶</span>START A ROOM
          </button>
          <button
            onClick={() => router.push(`/room/${newRoomId()}?demo=1`)}
            className="border border-[var(--line)] hover:border-white/40 px-6 py-4 text-sm text-[var(--ink)] transition-colors"
          >
            Watch a seeded demo
          </button>
          <form onSubmit={join} className="flex border border-[var(--line)] focus-within:border-[var(--accent)] transition-colors">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Room code"
              maxLength={6}
              autoComplete="off"
              className="flex-1 min-w-0 w-36 bg-transparent px-4 py-4 font-pixel text-sm tracking-[0.2em] placeholder:font-sans placeholder:tracking-normal placeholder:text-[var(--muted)]/70 outline-none"
            />
            <button type="submit" className="px-4 text-sm text-[var(--muted)] hover:text-white transition-colors">
              Join
            </button>
          </form>
        </motion.div>
      </section>

      <footer className="relative z-10 px-6 sm:px-10 py-6 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--muted)]">
        <span>Built for Meta&apos;s Bringing People Closer Together with AI hackathon</span>
        <span>Analysis by Muse Spark</span>
      </footer>
    </main>
  );
}
