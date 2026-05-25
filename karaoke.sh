#!/usr/bin/env bash
# Générateur de sous-titres ASS Karaoké
# Double-cliquez sur ce fichier pour lancer l'application

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
    # Aucun terminal trouvé : afficher une erreur graphique
    if command -v zenity &>/dev/null; then
        zenity --error --text="Aucun terminal trouvé.\nInstallez xterm : sudo apt install xterm"
    elif command -v xmessage &>/dev/null; then
        xmessage "Aucun terminal trouvé. Installez xterm : sudo apt install xterm"
    fi
    exit 1
fi

# ── Installation automatique si nécessaire ────────────────────────────────────
if [ ! -f "$VENV_DIR/bin/activate" ]; then
    echo "→  Premier lancement : installation des dépendances…"
    bash "$SCRIPT_DIR/install_karaoke.sh"
fi

# ── Lancement ─────────────────────────────────────────────────────────────────
source "$VENV_DIR/bin/activate"
python "$SCRIPT_DIR/karaoke_gen.py" "$@"

echo ""
echo "Appuyez sur Entrée pour fermer…"
read -r
