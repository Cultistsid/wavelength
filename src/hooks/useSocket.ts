'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWavelengthStore } from '@/lib/store';
import type { User, Message, AnalysisResult } from '@/types';

// Phones joining via QR hit the laptop's LAN IP, so derive the socket host from the page host.
function socketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) return process.env.NEXT_PUBLIC_SOCKET_URL;
  const port = process.env.NEXT_PUBLIC_SOCKET_PORT || '3001';
  return `${window.location.protocol}//${window.location.hostname}:${port}`;
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
    socket.on('analysis-started', () => store.setAnalyzing(true));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, currentUser]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !currentUser) return;
      const message: Message = {
        id: crypto.randomUUID(),
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
  }, [roomId]);

  const seedDemo = useCallback(() => {
    socketRef.current?.emit('seed-room', { roomId });
  }, [roomId]);

  return { sendMessage, requestAnalysis, seedDemo };
}
