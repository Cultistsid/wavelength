import { createServer } from 'http';
import { Server } from 'socket.io';
import Anthropic from '@anthropic-ai/sdk';
import type { User, Message, AnalysisResult } from './src/types';
import { USER_COLORS } from './src/lib/colors';

const PORT = Number(process.env.SOCKET_PORT || 3001);
const MODEL = process.env.MUSE_MODEL || 'muse-spark-1.2';
const MAX_ANALYSES = Number(process.env.MAX_ANALYSES || 200);
const MIN_INTERVAL_MS = Number(process.env.ANALYSIS_MIN_INTERVAL_MS || 8000);
const EVERY_N = Number(process.env.ANALYSIS_EVERY_N_MESSAGES || 4);

const client = new Anthropic({
  baseURL: process.env.ANTHROPIC_BASE_URL,
  authToken: process.env.ANTHROPIC_AUTH_TOKEN,
});

interface Room {
  users: User[];
  messages: Message[];
  lastAnalysisAt: number;
  analyzedUpTo: number;
  analyzing: boolean;
  seeded: boolean;
}

const rooms = new Map<string, Room>();
let analysesUsed = 0;

// Seeded demo: three "people" already mid-conversation so the graph lights up before judges type.
const SEED_USERS = ['Maya', 'Jordan', 'Priya'];
const SEED_SCRIPT: Array<[string, string]> = [
  ['Maya', 'ok real question: is anyone else here from out of town? I flew in from Austin this morning'],
  ['Jordan', 'Denver! landed at 6am, running on airport coffee'],
  ['Maya', 'Austin to Denver is such an easy flight, I go up for ski season every year'],
  ['Jordan', "no way, I'm at A-Basin most weekends. you should come up in January"],
  ['Priya', "I've never skied but I shoot a lot of film photography in the mountains, mostly Yosemite"],
  ['Maya', 'wait Jordan do you still have that ramen spot rec from last time'],
  ['Jordan', 'Kizuki. get the spicy miso. Maya you owe me one for that'],
  ['Priya', 'anyway if anyone wants prints from the Yosemite trip let me know'],
];
const isBot = (u: User) => u.id.startsWith('bot-');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SYSTEM = `You analyze a live group chat and surface human connection.
Return ONLY a JSON object, no prose, no code fences:
{
  "connections": [{"source": "<name>", "target": "<name>", "strength": 0.0-1.0, "topics": ["<short topic>"]}],
  "suggestions": [{"users": ["<name>", "<name>"], "topic": "<short topic>", "suggestion": "<one sentence, reference what they actually said>"}],
  "alerts": [{"userName": "<name>", "type": "quiet" | "excluded" | "dominant", "message": "<one warm sentence>"}],
  "vibeScore": 0-100,
  "insights": ["<one sentence>"]
}
Rules: names must be exact participant names. Max 3 suggestions, max 2 alerts. Only flag "quiet" for participants who have sent far fewer messages than others. Be specific and kind.`;

function parseJson(text: string): Partial<AnalysisResult> | null {
  const cleaned = text.replace(/```(?:json)?/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

function getRoom(roomId: string): Room {
  let room = rooms.get(roomId);
  if (!room) {
    room = { users: [], messages: [], lastAnalysisAt: 0, analyzedUpTo: 0, analyzing: false, seeded: false };
    rooms.set(roomId, room);
  }
  return room;
}

async function analyzeRoom(roomId: string, force = false): Promise<AnalysisResult | null> {
  const room = rooms.get(roomId);
  if (!room || room.analyzing) return null;
  if (room.messages.length < 3) return null;
  if (analysesUsed >= MAX_ANALYSES) {
    console.warn('Analysis budget exhausted');
    return null;
  }
  const now = Date.now();
  if (!force && now - room.lastAnalysisAt < MIN_INTERVAL_MS) return null;
  if (!force && room.messages.length === room.analyzedUpTo) return null;

  room.analyzing = true;
  room.lastAnalysisAt = now;
  room.analyzedUpTo = room.messages.length;
  analysesUsed++;
  io.to(roomId).emit('analysis-started');

  const counts = new Map<string, number>();
  for (const m of room.messages) counts.set(m.userName, (counts.get(m.userName) ?? 0) + 1);
  const participants = room.users
    .map((u) => `${u.name} (${counts.get(u.name) ?? 0} messages)`)
    .join(', ');
  const convo = room.messages.slice(-24).map((m) => `${m.userName}: ${m.content}`).join('\n');

  try {
    const res = await client.messages.create({
      model: MODEL,
      // Muse always reasons; 1024 is the minimum budget and leaves ~1000 tokens for the JSON.
      max_tokens: 2200,
      thinking: { type: 'enabled', budget_tokens: 1024 },
      system: SYSTEM,
      messages: [{ role: 'user', content: `Participants: ${participants}\n\nChat:\n${convo}` }],
    });
    // Muse prepends a redacted_thinking block; the JSON lives in the first text block.
    const text = res.content.find((c) => c.type === 'text')?.text ?? '';
    const parsed = parseJson(text);
    if (!parsed) {
      console.error('Unparseable analysis:', text.slice(0, 200));
      return null;
    }

    const nameToId = new Map(room.users.map((u) => [u.name, u.id]));
    const stamp = () => ({ id: crypto.randomUUID(), timestamp: Date.now() });

    const result: AnalysisResult = {
      connections: (parsed.connections ?? []).filter(
        (c) => nameToId.has(c.source) && nameToId.has(c.target) && c.source !== c.target
      ),
      suggestions: (parsed.suggestions ?? []).slice(0, 3).map((s) => ({ ...s, ...stamp() })),
      alerts: (parsed.alerts ?? [])
        .filter((a) => nameToId.has(a.userName))
        .slice(0, 2)
        .map((a) => ({ ...a, userId: nameToId.get(a.userName)!, ...stamp() })),
      vibeScore: Math.max(0, Math.min(100, Number(parsed.vibeScore ?? 50))),
      insights: parsed.insights ?? [],
    };
    console.log(`Analysis #${analysesUsed} for ${roomId}: vibe ${result.vibeScore}`);
    return result;
  } catch (e) {
    console.error('Analysis failed:', e instanceof Error ? e.message : e);
    return null;
  } finally {
    room.analyzing = false;
  }
}

const httpServer = createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, model: MODEL, analysesUsed, maxAnalyses: MAX_ANALYSES }));
});

const io = new Server(httpServer, { cors: { origin: true, methods: ['GET', 'POST'] } });

io.on('connection', (socket) => {
  let joined: { roomId: string; userId: string } | null = null;

  socket.on('join-room', ({ roomId, user }: { roomId: string; user: User }) => {
    const room = getRoom(roomId);
    socket.join(roomId);
    joined = { roomId, userId: user.id };
    if (!room.users.some((u) => u.id === user.id)) {
      const taken = new Set(room.users.map((u) => u.color));
      const color = USER_COLORS.find((c) => !taken.has(c)) ?? USER_COLORS[room.users.length % USER_COLORS.length];
      room.users.push({ ...user, name: String(user.name).slice(0, 24), color });
    }

    socket.emit('room-state', { users: room.users, messages: room.messages });
    socket.to(roomId).emit('user-joined', user);
  });

  socket.on('send-message', async ({ roomId, message }: { roomId: string; message: Message }) => {
    const room = rooms.get(roomId);
    if (!room || !joined || joined.roomId !== roomId) return;
    if (message?.userId !== joined.userId || !message.content?.trim()) return;
    const safe = { ...message, content: message.content.trim().slice(0, 500) };
    room.messages.push(safe);
    io.to(roomId).emit('new-message', safe);

    if (room.messages.length % EVERY_N === 0) {
      const analysis = await analyzeRoom(roomId);
      if (analysis) io.to(roomId).emit('analysis-update', analysis);
    }
  });

  socket.on('seed-room', async ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (!room || room.seeded || !joined || joined.roomId !== roomId) return;
    room.seeded = true;

    for (const name of SEED_USERS) {
      const taken = new Set(room.users.map((u) => u.color));
      const user: User = {
        id: `bot-${name.toLowerCase()}`,
        name,
        color: USER_COLORS.find((c) => !taken.has(c)) ?? USER_COLORS[room.users.length % USER_COLORS.length],
        joinedAt: Date.now(),
      };
      room.users.push(user);
      io.to(roomId).emit('user-joined', user);
      await sleep(350);
    }

    for (const [name, content] of SEED_SCRIPT) {
      const user = room.users.find((u) => u.name === name)!;
      const message: Message = { id: crypto.randomUUID(), userId: user.id, userName: name, content, timestamp: Date.now() };
      room.messages.push(message);
      io.to(roomId).emit('new-message', message);
      await sleep(900);
    }

    const analysis = await analyzeRoom(roomId, true);
    if (analysis) io.to(roomId).emit('analysis-update', analysis);
  });

  socket.on('request-analysis', async ({ roomId }: { roomId: string }) => {
    const analysis = await analyzeRoom(roomId, true);
    if (analysis) io.to(roomId).emit('analysis-update', analysis);
    else socket.emit('analysis-skipped');
  });

  socket.on('disconnect', () => {
    if (!joined) return;
    const room = rooms.get(joined.roomId);
    if (!room) return;
    const user = room.users.find((u) => u.id === joined!.userId);
    room.users = room.users.filter((u) => u.id !== joined!.userId);
    if (user) io.to(joined.roomId).emit('user-left', user);
    if (room.users.every(isBot)) rooms.delete(joined.roomId);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Wavelength socket server on :${PORT} using ${MODEL}`);
});
