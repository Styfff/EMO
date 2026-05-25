#!/usr/bin/env bash
# Lance le générateur de sous-titres ASS Karaoké
# Usage : bash karaoke.sh [fichier_audio] [options]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv_karaoke"

# ── Installation automatique si nécessaire ─────────────────────
if [ ! -f "$VENV_DIR/bin/activate" ]; then
    echo "→  Premier lancement : installation des dépendances…"
    bash "$SCRIPT_DIR/install_karaoke.sh"
fi

# ── Lancement ──────────────────────────────────────────────────
source "$VENV_DIR/bin/activate"
exec python "$SCRIPT_DIR/karaoke_gen.py" "$@"
