'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useWavelengthStore } from '@/lib/store';
import { useSocket } from '@/hooks/useSocket';
import {
  ConnectionGraph,
  VibeScore,
  ChatBox,
  BridgeSuggestions,
  InclusionAlerts,
  ParticipantList,
  QRPanel,
} from '@/components';
import { getRandomColor } from '@/lib/colors';

export default function RoomPage() {
  const roomId = (useParams().id as string).toUpperCase();
  const [name, setName] = useState('');
  const [qrOpen, setQrOpen] = useState(false);

  const currentUser = useWavelengthStore((s) => s.currentUser);
  const connected = useWavelengthStore((s) => s.connected);
  const analyzing = useWavelengthStore((s) => s.analyzing);
  const messages = useWavelengthStore((s) => s.messages);
  const setCurrentUser = useWavelengthStore((s) => s.setCurrentUser);
  const { sendMessage, requestAnalysis } = useSocket(roomId);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCurrentUser({
      id: crypto.randomUUID(),
      name: name.trim().slice(0, 24),
      color: getRandomColor(),
      joinedAt: Date.now(),
    });
  };

  if (!currentUser) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <form onSubmit={handleJoin} className="w-full max-w-sm">
          <p className="text-sm text-[var(--muted)]">Joining room</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-[0.25em] tabular-nums">{roomId}</h1>
          <label htmlFor="name" className="block mt-10 text-sm text-[var(--muted)]">
            What should the group call you?
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            autoComplete="off"
            maxLength={24}
            placeholder="Your first name"
            className="mt-2 w-full rounded-xl bg-[var(--surface)] ring-1 ring-white/10 px-4 py-3.5 text-lg text-white placeholder:text-[var(--muted)]/60 focus:ring-2 focus:ring-[var(--accent)] outline-none transition-shadow"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="mt-4 w-full rounded-xl bg-[var(--accent)] py-3.5 font-medium text-white disabled:opacity-40 hover:brightness-110 active:scale-[0.99] transition"
          >
            Join the conversation
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="h-dvh flex flex-col">
      <header className="shrink-0 border-b border-white/5">
        <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center gap-3">
          <h1 className="text-lg font-semibold">Wavelength</h1>
          <button
            onClick={() => setQrOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[var(--surface)] ring-1 ring-white/10 pl-3 pr-2 py-1 text-sm hover:ring-white/25 transition"
            aria-label="Show QR code to invite others"
          >
            <span className="tracking-[0.2em] tabular-nums">{roomId}</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-[var(--muted)]">Invite</span>
          </button>
          <span
            className={`h-2 w-2 rounded-full ${connected ? 'bg-[var(--aqua)]' : 'bg-[var(--muted)]/40'}`}
            title={connected ? 'Live' : 'Connecting…'}
          />
          <div className="ml-auto">
            <button
              onClick={requestAnalysis}
              disabled={analyzing || messages.length < 3}
              className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40 hover:brightness-110 active:scale-[0.98] transition"
            >
              {analyzing ? 'Reading…' : 'Read the room'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 mx-auto w-full max-w-[1400px] p-4 grid gap-4 grid-cols-1 grid-rows-[16rem_auto_1fr] lg:grid-cols-12 lg:grid-rows-1">
        <section className="relative lg:col-span-8 min-h-0 flex flex-col gap-3">
          <div className="flex-1 min-h-0">
            <ConnectionGraph />
          </div>
          <div className="hidden lg:block rounded-2xl bg-[var(--surface)] ring-1 ring-white/5 px-5 py-4">
            <VibeScore />
          </div>
        </section>

        <div className="lg:hidden rounded-2xl bg-[var(--surface)] ring-1 ring-white/5 px-4 py-3">
          <VibeScore />
        </div>

        <section className="lg:col-span-4 min-h-0 flex flex-col gap-3">
          <ParticipantList />
          <div className="flex-1 min-h-0">
            <ChatBox onSendMessage={sendMessage} />
          </div>
          <div className="max-h-[40%] overflow-y-auto space-y-3 pr-1">
            <BridgeSuggestions />
            <InclusionAlerts />
          </div>
        </section>
      </main>

      <QRPanel roomId={roomId} open={qrOpen} onClose={() => setQrOpen(false)} />
    </div>
  );
}
