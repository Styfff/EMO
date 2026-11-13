#!/bin/sh
# EXPO INFO « L'IA s'installe » — reconstruit le bulletin en une commande
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "LIB doit pointer vers la bibliothèque Lemo-Opuscar"; exit 1; }
[ -f "$HERE/raw/hall.jpg" ] && "$LIB/.venv/bin/python" "$HERE/tools/grade_hall.py"
cd "$LIB"
"$LIB/.venv/bin/python" core/tts/tts.py "$HERE/audio/lines.json" "$HERE/audio/voice"
"$LIB/.venv/bin/python" core/tts/asr_check.py "$HERE/audio/lines.json" "$HERE/audio/voice" --lang fr
node core/render/readcheck.mjs "$HERE"
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/audio/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/expo-info-ia.mp4" 24 0
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/audio/subs.json" "$HERE/expo-info-ia.srt"
