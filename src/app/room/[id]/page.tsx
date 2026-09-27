'use client';

import { useEffect, useRef, useState } from 'react';
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
  WaveField,
} from '@/components';
import { getRandomColor } from '@/lib/colors';
import { uid } from '@/lib/uid';

export default function RoomPage() {
  const roomId = (useParams().id as string).toUpperCase();
  const [name, setName] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const seededRef = useRef(false);

  const currentUser = useWavelengthStore((s) => s.currentUser);
  const connected = useWavelengthStore((s) => s.connected);
  const analyzing = useWavelengthStore((s) => s.analyzing);
  const messages = useWavelengthStore((s) => s.messages);
  const vibeScore = useWavelengthStore((s) => s.vibeScore);
  const setCurrentUser = useWavelengthStore((s) => s.setCurrentUser);
  const { sendMessage, requestAnalysis, seedDemo, makePlan } = useSocket(roomId);

  useEffect(() => {
    if (!connected || seededRef.current) return;
    if (new URLSearchParams(window.location.search).get('demo') === '1') {
      seededRef.current = true;
      seedDemo();
    }
  }, [connected, seedDemo]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCurrentUser({
      id: uid(),
      name: name.trim().slice(0, 24),
      color: getRandomColor(),
      joinedAt: Date.now(),
    });
  };

  if (!currentUser) {
    return (
      <main className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden scanlines">
        <WaveField energy={0.3} className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[50vh] w-full opacity-40 pointer-events-none" />
        <form onSubmit={handleJoin} className="relative w-full max-w-sm">
          <p className="font-pixel text-[10px] tracking-wider text-[var(--muted)]">JOINING ROOM</p>
          <h1 className="mt-2 font-pixel text-4xl tracking-[0.15em] glow-accent">{roomId}</h1>
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
            className="mt-2 w-full panel px-4 py-3.5 text-lg text-white placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)] outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="btn-outline mt-4 w-full font-pixel text-sm tracking-wider py-3.5 disabled:opacity-30 disabled:pointer-events-none"
          >
            <span className="caret mr-2">▶</span>JOIN THE CONVERSATION
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="h-dvh flex flex-col">
      <header className="shrink-0 border-b border-[var(--line)]">
        <div className="mx-auto max-w-[1440px] px-4 py-3 flex items-center gap-3">
          <span className="font-pixel text-sm tracking-wider text-[var(--accent)]">WAVELENGTH</span>
          <button
            onClick={() => setQrOpen(true)}
            className="flex items-center gap-2 border border-[var(--line)] hover:border-[var(--accent)] pl-3 pr-2 py-1 transition-colors"
            aria-label="Show QR code to invite others"
          >
            <span className="font-pixel text-xs tracking-[0.2em]">{roomId}</span>
            <span className="text-[10px] text-[var(--muted)]">INVITE</span>
          </button>
          <span
            className={`h-1.5 w-1.5 ${connected ? 'bg-[var(--aqua)] shadow-[0_0_8px_var(--aqua)]' : 'bg-[var(--muted)]/40'}`}
            title={connected ? 'Live' : 'Connecting…'}
          />
          <div className="ml-auto">
            <button
              onClick={requestAnalysis}
              disabled={analyzing || messages.length < 3}
              className="btn-outline font-pixel text-[11px] tracking-wider px-4 py-2 disabled:opacity-30 disabled:pointer-events-none"
            >
              {analyzing ? 'READING…' : 'READ THE ROOM'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 mx-auto w-full max-w-[1440px] p-3 sm:p-4 grid gap-3 sm:gap-4 grid-cols-1 grid-rows-[15rem_auto_1fr] lg:grid-cols-12 lg:grid-rows-1">
        <section className="relative lg:col-span-8 min-h-0 flex flex-col gap-3 sm:gap-4">
          <div className="flex-1 min-h-0 panel scanlines overflow-hidden">
            <WaveField energy={vibeScore / 100} className="absolute inset-x-0 bottom-0 h-1/3 w-full opacity-25 pointer-events-none" />
            <ConnectionGraph />
          </div>
          <div className="hidden lg:block panel px-5 py-4">
            <VibeScore />
          </div>
        </section>

        <div className="lg:hidden panel px-4 py-3">
          <VibeScore />
        </div>

        <section className="lg:col-span-4 min-h-0 flex flex-col gap-3 sm:gap-4">
          <ParticipantList />
          <div className="flex-1 min-h-0">
            <ChatBox onSendMessage={sendMessage} />
          </div>
          <div className="max-h-[40%] overflow-y-auto space-y-3 pr-1">
            <BridgeSuggestions onMakePlan={makePlan} />
            <InclusionAlerts />
          </div>
        </section>
      </main>

      <QRPanel roomId={roomId} open={qrOpen} onClose={() => setQrOpen(false)} />
    </div>
  );
}
