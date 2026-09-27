#!/usr/bin/env bash
# Generate the demo voiceover with macOS text-to-speech.
# Usage: scripts/voiceover.sh [voice] [rate]
#   voice  default Samantha. Better: download "Ava (Premium)" or "Evan (Enhanced)" in
#          System Settings > Accessibility > Spoken Content > System Voice > Manage Voices,
#          then run: scripts/voiceover.sh "Ava (Premium)"
#   rate   words per minute, default 168
set -euo pipefail
VOICE="${1:-Samantha}"
RATE="${2:-168}"
OUT="docs/voiceover"
mkdir -p "$OUT"

# Beat start times in seconds, matching docs/submission.md.
STARTS=(0 30 45 60 80 105 120 150)
TEXTS=(
"Every group chat works the same way. Two people find a thread and run with it. Someone mentions a thing nobody picks up. A new person reads along and never finds a way in. The shared interest that would have connected them was right there in the messages. Nobody was watching for it. Wavelength watches for it, while the conversation is still happening, so the group can act on it."
"I'll start a room. This one comes pre-loaded so you can see it work fast."
"Anyone can join by scanning this code. No account, just a first name. That's me joining from my phone, the way a judge would."
"Three people are already talking. Maya and Jordan are bonding over Denver and skiing. Priya mentions her photography and nobody picks it up. After a few messages, Muse reads the room. That wave between Maya and Jordan is a connection it found, labeled with what they share. Stronger bonds are warmer and wider."
"Down here it suggests an opening: Priya's Yosemite photos and Maya's mountains are the same conversation. And it noticed that I joined and haven't said anything yet. That's the moment I care about. The person on the edge gets named before they drift away."
"I'll reply to Priya. Read the room again, and now I'm on the graph, and the group's score goes up. And a shared interest shouldn't stay a chat message: one tap and it's a plan, a real spot a mile from here, with the invitation written for you. Connection isn't measured after the fact. It changes while you talk."
"The AI is Meta's Muse Spark. The server sends it the recent chat and asks for strict JSON: who's connecting, over what, how strongly, who needs a way in, and a score. Every name is checked against the live roster before it's drawn. Muse always reasons before answering, so I cap its thinking budget and rate-limit calls to stay inside the credits. Without the model there is no graph. It is the whole product."
"I built this solo in one night. Next.js, D3 and Framer Motion for the front end, Socket.io for real time, Muse through the Anthropic SDK, OpenStreetMap for the plans. I used Claude Code as a pair programmer, and ran agents for code review and browser testing while I built. Wavelength. Find the room's frequency."
)

inputs=()
filters=""
n=${#TEXTS[@]}
cursor=0
for ((i = 0; i < n; i++)); do
  idx=$((i + 1))
  say -v "$VOICE" -r "$RATE" -o "$OUT/beat$idx.aiff" "${TEXTS[$i]}"
  ffmpeg -y -loglevel error -i "$OUT/beat$idx.aiff" -c:a aac -b:a 128k "$OUT/beat$idx.m4a"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/beat$idx.m4a")
  start=${STARTS[$i]}
  # Never overlap: if the previous beat ran long, start right after it.
  if (( $(echo "$cursor > $start" | bc -l) )); then start=$cursor; fi
  ms=$(printf "%.0f" "$(echo "$start * 1000" | bc -l)")
  inputs+=(-i "$OUT/beat$idx.m4a")
  filters+="[$i]adelay=${ms}|${ms}[a$i];"
  cursor=$(echo "$start + $dur + 0.6" | bc -l)
  printf "beat %d  start %6.1fs  length %5.1fs\n" "$idx" "$start" "$dur"
done

mix=""
for ((i = 0; i < n; i++)); do mix+="[a$i]"; done
ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex "${filters}${mix}amix=inputs=$n:normalize=0,loudnorm" \
  -c:a aac -b:a 160k "$OUT/voiceover.m4a"
rm -f "$OUT"/*.aiff
printf "total %.1fs -> %s\n" "$cursor" "$OUT/voiceover.m4a"
