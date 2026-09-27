# Wavelength

A group chat that shows the room finding its frequency. Live AI (Meta Muse Spark) reads the
conversation and surfaces who is clicking, what they share, and who could use a way in.

Built for Meta's "Bringing People Closer Together with AI" hackathon.

## Demo flow for judges

1. Presenter opens a room on the laptop and clicks the room code to show the QR.
2. Judges scan it on their phones, type a first name, and start talking.
3. Every four messages (or on "Read the room") Muse analyzes the chat and the graph updates:
   - waves between people grow and warm from violet to aqua to amber as bonds strengthen
   - bridge suggestions call out specific shared ground
   - inclusion notes flag anyone who has gone quiet
   - the vibe gauge tracks the group's overall connection

## Make a plan

Every bridge suggestion has a "Make a plan nearby" button. The server maps the shared topic to
OpenStreetMap tags, queries Overpass for spots within 3 km of Midtown Atlanta (hard-coded to the
hackathon venue), and asks Muse to pick one and write a one-line invitation. If Overpass is slow
or empty it falls back to a curated list of real Atlanta spots, so a plan always lands. The card
shows a dark-styled OSM tile map with the spot centred and an "Open in Maps" link.

## Seeded demo

"Watch a seeded demo" on the landing page (or any room URL with `?demo=1`) drops three
scripted participants into the room, streams eight messages with typing-speed pacing, then runs
one analysis. The graph is already lit when judges scan in, and because they have not spoken
yet, the first inclusion note is usually about them.

## Run it

```bash
npm install
cp .env.example .env.local   # add your Muse key
npm run dev                  # Next on :3000, socket server on :3001
```

Phones must be on the same Wi-Fi as the laptop. Open `http://<laptop-lan-ip>:3000`, not
`localhost`, before showing the QR so the code encodes an address phones can reach.

## Deploy

- **Socket server → Render** (free): New + Blueprint, pick this repo, `render.yaml` sets it up.
  Paste `ANTHROPIC_AUTH_TOKEN` when asked. Note the URL, e.g. `https://wavelength-socket.onrender.com`.
- **Web app → Vercel**: `vercel --prod` with env `NEXT_PUBLIC_SOCKET_URL=<render url>`.
- Free Render instances sleep after 15 min idle; the first join after that takes ~40 s to wake.

## Budget guard

Muse always spends reasoning tokens, so the server caps thinking at 1024 tokens, analyzes at
most once per 8 seconds per room, and stops after `MAX_ANALYSES` calls (see `.env.local`).
`GET http://localhost:3001` reports how many analyses have been used.

## Stack

Next.js 16, Framer Motion, D3 force layout, Socket.io, Zustand, Meta Muse via the
Anthropic-compatible API.
