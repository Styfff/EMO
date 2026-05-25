#!/usr/bin/env bash
# Lance l'interface web du générateur karaoké ASS
# Double-cliquez sur ce fichier pour ouvrir l'application dans votre navigateur

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv_karaoke"

# ── Si pas dans un terminal, se relancer dans un ──────────────────────────────
if [ ! -t 0 ]; then
    for TERM_EMU in gnome-terminal xfce4-terminal konsole lxterminal mate-terminal xterm; do
        if command -v "$TERM_EMU" &>/dev/null; then
            case "$TERM_EMU" in
                gnome-terminal) "$TERM_EMU" -- bash "$0" "$@" ;;
                *)              "$TERM_EMU" -e "bash '$0' $*" ;;
            esac
            exit
        fi
    done
    if command -v zenity &>/dev/null; then
        zenity --error --text="Aucun terminal trouvé.\nInstallez xterm : sudo apt install xterm"
    fi
    exit 1
fi

# ── Installation automatique si nécessaire ────────────────────────────────────
if [ ! -f "$VENV_DIR/bin/activate" ]; then
    echo "→  Premier lancement : installation des dépendances…"
    bash "$SCRIPT_DIR/install_karaoke.sh"
fi

source "$VENV_DIR/bin/activate"

# Flask (ajout si absent)
python -c "import flask" 2>/dev/null || {
    echo "→  Installation de Flask…"
    pip install flask --quiet
}

echo "══════════════════════════════════════════"
echo "  🎤  Karaoké ASS Generator — Interface web"
echo "  Ouvrez : http://127.0.0.1:5000"
echo "  Ctrl+C pour arrêter"
echo "══════════════════════════════════════════"
echo ""

python "$SCRIPT_DIR/karaoke_web.py"

echo ""
echo "Serveur arrêté. Appuyez sur Entrée pour fermer…"
read -r
