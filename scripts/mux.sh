#!/usr/bin/env bash
# Combine a silent screen recording with the generated voiceover.
# Usage: scripts/mux.sh ~/Desktop/screen.mov [out.mp4]
# Record the screen with Cmd+Shift+5 (no mic needed), following the beat times printed by
# scripts/voiceover.sh. The video is padded or trimmed to the voiceover length.
set -euo pipefail
IN="${1:?path to screen recording}"
OUT="${2:-docs/wavelength_final.mp4}"
VO="docs/voiceover/voiceover.m4a"
[[ -f "$VO" ]] || { echo "run scripts/voiceover.sh first"; exit 1; }

vdur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
adur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VO")
printf "video %.1fs, voiceover %.1fs\n" "$vdur" "$adur"

ffmpeg -y -loglevel error -i "$IN" -i "$VO" \
  -filter_complex "[0:v]scale='min(1920,iw)':-2,tpad=stop_mode=clone:stop_duration=600[v]" \
  -map "[v]" -map 1:a -t "$adur" \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 160k \
  "$OUT"
echo "wrote $OUT"
