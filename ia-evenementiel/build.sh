#!/bin/sh
# Le fil — reconstruit le film en une commande : événements → son → image → mixage final
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "LIB doit pointer vers la bibliothèque Lemo-Opuscar"; exit 1; }
cd "$LIB"
"$LIB/.venv/bin/python" core/audio/sampler.py --need jazz_bass upright clarinet snare hihat vibraphone glockenspiel marimba bass_drum sus_cymbal
node core/render/events.mjs "$HERE"
"$LIB/.venv/bin/python" core/tts/tts.py "$HERE/audio/lines.json" "$HERE/audio/voice"
"$LIB/.venv/bin/python" core/tts/asr_check.py "$HERE/audio/lines.json" "$HERE/audio/voice" --lang fr
"$LIB/.venv/bin/python" "$HERE/audio/mix.py"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/le-fil.mp4" 24 1
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/audio/subs.json" "$HERE/le-fil.srt"
