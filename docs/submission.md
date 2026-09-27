# Wavelength — submission package

## 1. Project name and elevator pitch

**Project name:** Wavelength

Elevator pitch (pick one, all under 60 characters):

1. A group chat that shows the room finding its frequency
2. Live AI that shows a group who is clicking, and who isn't
3. See connections form in a conversation, in real time

## 2. Project story

### Inspiration

Every group chat has the same shape. Two people find a thread and run with it. Someone drops a
detail that nobody picks up. A newcomer reads along and never finds the door in. The interest
that would have connected them was right there in the messages; nobody had the attention to
notice it.

Meta's brief asked for AI that identifies common interests that could spark a new connection.
I wanted to make that visible while the conversation is still happening, not in a summary
afterwards, so the group itself can act on it.

### What it does

Wavelength is a live chat room with a second view of the conversation drawn next to it. People
join by scanning a QR code and typing a first name. As they talk, Meta's Muse Spark reads the
recent messages and returns three things:

- **Connections**: who is bonding with whom, over what, and how strongly. These are drawn as
  animated waves between people. The amplitude grows with strength and the color warms from
  violet to aqua to amber. Each wave carries the topic that links the two people.
- **Bridge suggestions**: specific, quotable openings such as "Priya's Yosemite photos and
  Maya's ski trips are the same mountains — ask her about it." They reference what people
  actually said.
- **Inclusion notes**: when someone has gone quiet or offered something the group did not pick
  up, the room is told, warmly, so the group can pull them back in.
- **Make a plan**: every bridge suggestion has a button that turns the shared interest into a
  concrete plan nearby. The server maps the topic to OpenStreetMap tags, finds spots within 3 km
  of the venue in Midtown Atlanta, and Muse picks one and writes the invitation: "Priya and
  Jordan, head to Jackson Street Bridge after to swap Yosemite and A-Basin stories while
  snapping skyline photos together." The card shows a map with the spot and a link to
  directions.

A vibe gauge tracks the group's overall connection from 0 to 100. Analysis runs every four
messages or on demand with the "Read the room" button.

The point is not that an AI knows the group is connected. The point is that the group can see
it, and the person on the edge gets named before they drift away.

### How we built it

Solo, overnight. I used Claude Code (Fable 5.1) as a pair programmer for the full build, and
spun up agents for code review, browser QA of the join and analysis flows, and this
documentation.

- **Frontend**: Next.js 16 with React 19 and TypeScript. Framer Motion for the interface
  animations, D3 for the force layout, and a hand-drawn sine path for each link so connections
  read as waves rather than lines. A canvas oscilloscope sits under the graph and on the landing
  page, and its energy follows the vibe score. Zustand holds room state on the client.
- **Real time**: a small Socket.io server keeps rooms in memory, broadcasts messages, assigns
  each participant a distinct color, and decides when to call the model.
- **AI**: Muse Spark through Meta's Anthropic-compatible endpoint, called with the Anthropic
  TypeScript SDK. A single system prompt asks for strict JSON: connections, suggestions, alerts,
  vibe score, one insight. The server validates every name against the live roster before
  drawing anything.
- **Places**: OpenStreetMap's Overpass API for nearby venues, with a curated list of real Atlanta
  spots as a fallback so the demo never shows an empty plan. The mini-map is drawn from OSM
  raster tiles positioned so the venue sits at the centre; no map SDK, no API key.
- **Judge flow**: the room code opens a QR panel. The socket URL is derived from the page host,
  so phones on the same Wi-Fi reach the laptop directly. A seeded demo mode drops three
  scripted participants into a room and streams eight messages at typing pace, so the graph is
  already lit when a judge scans in.

### Challenges

- Muse Spark always reasons before it answers, and reasoning cannot be turned off. My first
  calls burned the whole token budget on thinking and returned empty content. The fix was to
  set an explicit thinking budget at the minimum of 1024 tokens, give the response 4000 tokens
  of headroom, and retry once if the text block comes back empty.
- The response puts a `redacted_thinking` block before the text block. Reading `content[0]`
  silently yielded nothing; the parser now finds the first text block and strips any code
  fences before parsing JSON.
- The build ran on $50 of Meta API credits. The server rate-limits analysis to once per eight
  seconds per room, analyzes only the last 24 messages, and stops after a configurable cap.
  The health endpoint reports how many calls have been used.
- Rooms live in server memory. That is fine for a demo but it means a socket-server restart
  wipes the conversation; the client de-duplicates by message id so reconnects do not double
  the chat.
- Drawing waves that feel alive without distracting from the chat took tuning: the wave tapers
  to zero at both ends so it meets each node cleanly, and the analysis sweep flashes links
  white for under a second before they settle into their color.

### What we learned

Judges do not need a product; they need a moment. The strongest thing in the demo is not the
graph, it is the inclusion note that names the person who just walked up and has not spoken.
People react to being seen.

On the model side: treat every provider's compatibility layer as its own API. Two quirks
(forced reasoning, block ordering) cost more time than the whole prompt design.

### What's next

- Voice rooms using Muse Voice Transcribe so the same analysis runs on a table conversation.
- Persistent rooms so a Messenger or WhatsApp group can watch its connection history over weeks.
- Let participants accept a bridge suggestion with one tap, which posts it as an opener.
- Sentiment tracking so the gauge reflects warmth, not just overlap of interests.

## 3. Built with

meta-muse-spark, next.js, react, typescript, socket.io, d3.js, framer-motion, tailwindcss,
zustand, node.js, websockets, anthropic-sdk, openstreetmap, overpass-api, canvas, svg,
qrcode.react, claude-code, tsx, eslint

## 4. Video script (target 2:30)

Pre-recording checklist: open the laptop on `http://<LAN-IP>:3000` not localhost; confirm
`curl localhost:3001` shows MAX_ANALYSES headroom; phone on the same Wi-Fi; close other browser
tabs so animations run at full rate; screen-record the laptop and film the phone over the
shoulder.

| Time | On screen | Voiceover |
|---|---|---|
| 0:00–0:30 | Landing page. Headline "Find the room's frequency." with the oscilloscope behind it. Cut to a stock-style shot of a group chat scrolling. | Every group chat works the same way. Two people find a thread and run with it. Someone mentions a thing nobody picks up. A new person reads along and never finds a way in. The shared interest that would have connected them was right there in the messages. Nobody was watching for it. Wavelength watches for it, while the conversation is still happening, so the group can act on it. |
| 0:30–0:45 | Click "Watch a seeded demo". Join screen with room code glowing. Type a name, join. Empty graph with four dots. | I'll start a room. This one comes pre-loaded so you can see it work fast. |
| 0:45–1:00 | Click the room code. QR panel fills the screen. Phone enters frame, scans, join page appears on the phone, name typed. Phone appears as a new node. | Anyone can join by scanning this code. No account, just a first name. That's me joining from my phone, the way a judge would. |
| 1:00–1:20 | Chat streams in: Maya and Jordan on skiing and ramen, Priya on film photography. Header shows "READING…". Pulse rings sweep the graph, a wave draws between Maya and Jordan and settles amber. | Three people are already talking. Maya and Jordan are bonding over Denver and skiing. Priya mentions her photography and nobody picks it up. After a few messages Muse reads the room. That wave between Maya and Jordan is a connection it found, labeled with what they share. Stronger bonds are warmer and wider. |
| 1:20–1:45 | Zoom on the bridge card and the inclusion notes. Highlight the note about the presenter's name. Vibe gauge reads its score with the insight line. | Down here it suggests an opening: Priya's Yosemite photos and Maya's mountains are the same conversation. And it noticed that I joined and haven't said anything yet. That's the moment I care about. The person on the edge gets named before they drift away. |
| 1:45–2:00 | Presenter types one message from the phone replying to Priya. Click "Read the room". Pulse, a new wave appears to the presenter's node, vibe number climbs. Click "Make a plan nearby" on the Priya card; map slides open with Jackson Street Bridge. | I'll reply to Priya. Read the room again, and now I'm on the graph, and the group's score goes up. And a shared interest shouldn't stay a chat message: one tap and it's a plan, a real spot a mile from here, with the invitation written for you. Connection isn't measured after the fact. It changes while you talk. |
| 2:00–2:30 | Short screen capture of `server.ts`: the system prompt and the Muse call with the thinking budget. Then the JSON response. Cut back to the graph. | The AI is Meta's Muse Spark. The server sends it the recent chat and asks for strict JSON: who's connecting, over what, how strongly, who needs a way in, and a score. Every name is checked against the live roster before it's drawn. Muse always reasons before answering, so I cap its thinking budget and rate-limit calls to stay inside the credits. Without the model there is no graph; it is the whole product. |
| 2:30–2:50 | Quick montage: Next.js and D3 code, Socket.io server log, Claude Code terminal, the review agent's findings. End on the landing page. | I built this solo in one night. Next.js, D3 and Framer Motion for the front end, Socket.io for real time, Muse through the Anthropic SDK. I used Claude Code as a pair programmer, and ran agents for code review and browser testing while I built. Wavelength. Find the room's frequency. |

## 5. Demo-day runbook

- Laptop and phone on the same Wi-Fi; open `http://<LAN-IP>:3000`, never localhost.
- `npm run dev`, then `curl localhost:3001` to confirm the model name and analyses used.
- Start with "Watch a seeded demo" so the graph is lit before anyone scans.
- Show the QR immediately; hand judges the first message so the inclusion note lands on them.
- Use "Read the room" on cue rather than waiting for the four-message trigger.
- If the socket server restarts, the chat survives on screen but the room is empty server-side; start a fresh seeded room.
- Keep one browser tab; background tabs throttle the animations.
- If Muse returns nothing, check the socket log for "Unparseable analysis" and retry; the credit cap is 200 calls.
