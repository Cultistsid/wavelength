'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWavelengthStore } from '@/lib/store';
import { uid } from '@/lib/uid';
import type { User, Message, AnalysisResult, Plan, BridgeSuggestion } from '@/types';

// Dev: Next on :3000, socket on :3001 (phones hit the laptop's LAN IP, so use the page host).
// Prod: one server serves both, so the socket is same-origin.
function socketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) return process.env.NEXT_PUBLIC_SOCKET_URL;
  const { protocol, hostname, port, origin } = window.location;
  if (port === '3000') return `${protocol}//${hostname}:${process.env.NEXT_PUBLIC_SOCKET_PORT || '3001'}`;
  return origin;
}

export function useSocket(roomId: string) {
  const socketRef = useRef<Socket | null>(null);
  const currentUser = useWavelengthStore((s) => s.currentUser);

  useEffect(() => {
    if (!currentUser) return;
    const store = useWavelengthStore.getState();
    const socket = io(socketUrl(), { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      store.setConnected(true);
      socket.emit('join-room', { roomId, user: currentUser });
    });
    socket.on('disconnect', () => store.setConnected(false));

    socket.on('room-state', ({ users, messages }: { users: User[]; messages: Message[] }) => {
      store.addUsers(users);
      store.addMessages(messages);
    });
    socket.on('user-joined', (user: User) => store.addUser(user));
    socket.on('user-left', (user: User) => store.removeUser(user.id));
    socket.on('new-message', (message: Message) => store.addMessage(message));
    socket.on('analysis-update', (analysis: AnalysisResult) => store.applyAnalysis(analysis));
    socket.on('analysis-skipped', () => store.setAnalyzing(false));
    socket.on('analysis-done', () => store.setAnalyzing(false));
    socket.on('analysis-started', () => store.setAnalyzing(true));
    socket.on('plan-ready', (plan: Plan) => store.setPlan(plan));
    socket.on('plan-failed', ({ suggestionId }: { suggestionId: string }) => store.setPlanning(suggestionId, false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, currentUser]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !currentUser) return;
      const message: Message = {
        id: uid(),
        userId: currentUser.id,
        userName: currentUser.name,
        content,
        timestamp: Date.now(),
      };
      socketRef.current.emit('send-message', { roomId, message });
    },
    [roomId, currentUser]
  );

  const requestAnalysis = useCallback(() => {
    useWavelengthStore.getState().setAnalyzing(true);
    socketRef.current?.emit('request-analysis', { roomId });
    // Safety net so a dropped response can never leave the button stuck on "Reading…".
    setTimeout(() => useWavelengthStore.getState().setAnalyzing(false), 20000);
  }, [roomId]);

  const seedDemo = useCallback(() => {
    socketRef.current?.emit('seed-room', { roomId });
  }, [roomId]);

  const makePlan = useCallback(
    (s: BridgeSuggestion) => {
      useWavelengthStore.getState().setPlanning(s.id, true);
      socketRef.current?.emit('make-plan', { roomId, suggestionId: s.id, topic: s.topic, users: s.users, suggestion: s.suggestion });
      setTimeout(() => useWavelengthStore.getState().setPlanning(s.id, false), 30000);
    },
    [roomId]
  );

  return { sendMessage, requestAnalysis, seedDemo, makePlan };
}
