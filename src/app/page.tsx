'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const newRoomId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length >= 4) router.push(`/room/${code.trim().toUpperCase()}`);
  };

  return (
    <main className="min-h-screen flex flex-col">
      <section className="relative flex-1 flex flex-col justify-center px-6 py-16 max-w-3xl mx-auto w-full">
        <motion.svg
          viewBox="0 0 960 160"
          preserveAspectRatio="none"
          className="fixed left-0 right-0 top-1/2 -translate-y-1/2 w-screen h-56 pointer-events-none"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        >
          <path className="wave-line" d="M0 80 C 80 20, 160 20, 240 80 S 400 140, 480 80 S 640 20, 720 80 S 880 140, 960 80" fill="none" stroke="var(--accent)" strokeWidth="3" style={{ filter: 'drop-shadow(0 0 6px var(--accent))' }} />
          <path className="wave-line" d="M0 80 C 100 130, 200 130, 300 80 S 500 30, 600 80 S 800 130, 900 80 S 1000 40, 1060 80" fill="none" stroke="var(--aqua)" strokeWidth="3" style={{ animationDelay: '-2s', filter: 'drop-shadow(0 0 6px var(--aqua))' }} />
          <path className="wave-line" d="M0 80 C 60 50, 120 50, 180 80 S 300 110, 360 80 S 480 50, 540 80 S 660 110, 720 80 S 840 50, 900 80 S 1000 110, 1060 80" fill="none" stroke="var(--amber)" strokeWidth="2.5" style={{ animationDelay: '-4s', filter: 'drop-shadow(0 0 6px var(--amber))' }} />
        </motion.svg>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative"
        >
          <h1 className="text-6xl sm:text-7xl font-semibold tracking-tight">Wavelength</h1>
          <p className="mt-5 max-w-md text-lg text-[var(--muted)] leading-relaxed">
            A group chat that shows the room finding its frequency. Live AI spots who is
            clicking, what they share, and who could use a way in.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-3 sm:items-stretch">
            <button
              onClick={() => router.push(`/room/${newRoomId()}`)}
              className="rounded-xl bg-[var(--accent)] px-6 py-4 text-base font-medium text-white hover:brightness-110 active:scale-[0.99] transition"
            >
              Start a room
            </button>
            <form onSubmit={join} className="flex flex-1 rounded-xl bg-[var(--surface)] ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-[var(--accent)] transition-shadow">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Room code"
                maxLength={6}
                autoComplete="off"
                className="flex-1 min-w-0 bg-transparent px-5 py-4 text-base tracking-[0.25em] uppercase placeholder:tracking-normal placeholder:normal-case placeholder:text-[var(--muted)]/70 outline-none"
              />
              <button type="submit" className="px-5 text-sm text-[var(--muted)] hover:text-white transition-colors">
                Join
              </button>
            </form>
          </div>
        </motion.div>
      </section>

      <footer className="px-6 py-6 text-center text-xs text-[var(--muted)]">
        Built for Meta&apos;s Bringing People Closer Together with AI hackathon, powered by Muse Spark.
      </footer>
    </main>
  );
}
