'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWavelengthStore } from '@/lib/store';

interface ChatBoxProps {
  onSendMessage: (content: string) => void;
}

export function ChatBox({ onSendMessage }: ChatBoxProps) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const messages = useWavelengthStore((s) => s.messages);
  const users = useWavelengthStore((s) => s.users);
  const currentUser = useWavelengthStore((s) => s.currentUser);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSendMessage(text);
    setInput('');
  };

  const colorOf = (userId: string) => users.find((u) => u.id === userId)?.color ?? 'var(--muted)';

  return (
    <div className="flex h-full flex-col panel overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--muted)] pt-2">
            Say hi. Ask the group something you actually want to know.
          </p>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const mine = m.userId === currentUser?.id;
            const sameAsPrev = i > 0 && messages[i - 1].userId === m.userId;
            return (
              <motion.div
                key={m.id}
                layout="position"
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className={`flex flex-col ${mine ? 'items-end' : 'items-start'} ${sameAsPrev ? '-mt-1' : ''}`}
              >
                {!sameAsPrev && (
                  <span className="mb-1 text-[11px] font-medium" style={{ color: colorOf(m.userId) }}>
                    {m.userName}
                  </span>
                )}
                <div
                  className={`max-w-[85%] px-3.5 py-2 text-[15px] leading-snug ${
                    mine ? 'bg-[var(--accent)] text-black' : 'bg-white/[0.07] text-[var(--ink)]'
                  }`}
                >
                  {m.content}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-[var(--line)] p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message the room"
          maxLength={500}
          autoComplete="off"
          className="flex-1 min-w-0 border border-[var(--line)] bg-transparent px-4 py-2.5 text-[15px] text-white placeholder:text-[var(--muted)]/70 outline-none focus:border-[var(--accent)] transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="btn-outline font-pixel text-[11px] tracking-wider px-4 disabled:opacity-30 disabled:pointer-events-none"
        >
          SEND
        </button>
      </form>
    </div>
  );
}
