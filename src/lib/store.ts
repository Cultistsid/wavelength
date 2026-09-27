import { create } from 'zustand';
import type { User, Message, Connection, BridgeSuggestion, InclusionAlert, AnalysisResult } from '@/types';

interface WavelengthStore {
  currentUser: User | null;
  users: User[];
  messages: Message[];
  connections: Connection[];
  suggestions: BridgeSuggestion[];
  alerts: InclusionAlert[];
  vibeScore: number;
  insight: string | null;
  analyzing: boolean;
  connected: boolean;
  lastAnalysisAt: number;

  setCurrentUser: (user: User | null) => void;
  setConnected: (connected: boolean) => void;
  setAnalyzing: (analyzing: boolean) => void;
  addUser: (user: User) => void;
  addUsers: (users: User[]) => void;
  removeUser: (userId: string) => void;
  addMessage: (message: Message) => void;
  addMessages: (messages: Message[]) => void;
  applyAnalysis: (analysis: AnalysisResult) => void;
  dismissSuggestion: (id: string) => void;
  dismissAlert: (id: string) => void;
  reset: () => void;
}

const initialState = {
  currentUser: null,
  users: [],
  messages: [],
  connections: [],
  suggestions: [],
  alerts: [],
  vibeScore: 50,
  insight: null,
  analyzing: false,
  connected: false,
  lastAnalysisAt: 0,
};

const mergeById = <T extends { id: string }>(existing: T[], incoming: T[]): T[] => {
  const seen = new Set(existing.map((e) => e.id));
  return [...existing, ...incoming.filter((i) => !seen.has(i.id))];
};

export const useWavelengthStore = create<WavelengthStore>((set) => ({
  ...initialState,

  setCurrentUser: (currentUser) => set({ currentUser }),
  setConnected: (connected) => set({ connected }),
  setAnalyzing: (analyzing) => set({ analyzing }),

  addUser: (user) => set((s) => ({ users: mergeById(s.users, [user]) })),
  // Server owns the roster (it assigns colors), so a room-state snapshot replaces it.
  addUsers: (users) => set({ users }),
  removeUser: (userId) => set((s) => ({ users: s.users.filter((u) => u.id !== userId) })),

  addMessage: (message) => set((s) => ({ messages: mergeById(s.messages, [message]) })),
  addMessages: (messages) => set((s) => ({ messages: mergeById(s.messages, messages) })),

  applyAnalysis: (a) =>
    set({
      connections: a.connections,
      suggestions: a.suggestions,
      alerts: a.alerts,
      vibeScore: a.vibeScore,
      insight: a.insights[0] ?? null,
      analyzing: false,
      lastAnalysisAt: Date.now(),
    }),

  dismissSuggestion: (id) => set((s) => ({ suggestions: s.suggestions.filter((x) => x.id !== id) })),
  dismissAlert: (id) => set((s) => ({ alerts: s.alerts.filter((x) => x.id !== id) })),

  reset: () => set(initialState),
}));
