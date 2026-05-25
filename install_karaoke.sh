#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  install_karaoke.sh — Installation du générateur karaoké ASS
# ─────────────────────────────────────────────────────────────
set -euo pipefail

VENV_DIR="venv_karaoke"

echo "══════════════════════════════════════════════════"
echo "  Installation — Générateur de Sous-titres Karaoké"
echo "══════════════════════════════════════════════════"

# ── Vérification Python ────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
    echo "❌  Python 3 est requis mais introuvable."
    exit 1
fi
PYTHON_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "✓  Python $PYTHON_VER détecté"

# ── Vérification ffmpeg ────────────────────────────────────────
if command -v ffmpeg &>/dev/null; then
    echo "✓  ffmpeg détecté"
else
    echo "⚠️   ffmpeg non trouvé — requis par Whisper pour décoder l'audio"
    echo "    Ubuntu/Debian : sudo apt install ffmpeg"
    echo "    macOS         : brew install ffmpeg"
    echo "    Windows       : https://ffmpeg.org/download.html"
fi

# ── Environnement virtuel ──────────────────────────────────────
if [ ! -d "$VENV_DIR" ]; then
    echo "→  Création de l'environnement virtuel ($VENV_DIR)…"
    python3 -m venv "$VENV_DIR"
fi

# ── Activation ────────────────────────────────────────────────
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"
echo "✓  Environnement virtuel activé"

# ── Installation des paquets ───────────────────────────────────
echo "→  Installation des dépendances (peut prendre quelques minutes)…"
pip install --quiet --upgrade pip
pip install --quiet openai-whisper rich

echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅  Installation terminée !"
echo ""
echo "  Pour utiliser le générateur :"
echo "    source $VENV_DIR/bin/activate"
echo "    python karaoke_gen.py <fichier_audio>"
echo ""
echo "  Exemples :"
echo "    python karaoke_gen.py chanson.mp3"
echo "    python karaoke_gen.py chanson.wav -o paroles.ass"
echo "    python karaoke_gen.py chanson.mp3 --model large --font \"Arial Black\""
echo "══════════════════════════════════════════════════"
