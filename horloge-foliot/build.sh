#!/bin/sh
# One command: Horloge à foliot, éclatée — events → picture → score + mix → master → poster
#   LIB=<path to lemo-opuscar> sh build.sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/root/lemo-opuscar}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=horloge-foliot
cd "$LIB"
[ -f core/assets/polyhaven/photo_studio_loft_hall_2k.hdr ] || sh tools/fetch.sh hdri
"$PY" core/audio/sampler.py --need "$HERE/mix.py"
# no GPU: LEMO_ANGLE=swiftshader renders in software (about 5 s a frame)
export LEMO_ANGLE=${LEMO_ANGLE:-swiftshader}
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers ${WORKERS:-2} --q 'ss=1' --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/$NAME.mp4" 24 1
node core/render/still.mjs "$HERE" 49.9 --q ss=2 --prefix poster_ --out "$HERE/out"
ffmpeg -v error -y -i "$HERE/out/poster_49.9.jpg" -q:v 2 "$HERE/poster.jpg"
echo "done: $HERE/$NAME.mp4"
