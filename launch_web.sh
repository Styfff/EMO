#!/usr/bin/env bash
# Lance l'interface web du générateur karaoké ASS
# Double-cliquez sur ce fichier pour ouvrir l'application dans votre navigateur

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv_karaoke"

# ── Si pas dans un terminal, se relancer dans un ──────────────────────────────
if [ ! -t 0 ]; then
    LAUNCHED=0
    # Essai avec x-terminal-emulator (alias standard Debian/Ubuntu)
    if command -v x-terminal-emulator &>/dev/null; then
        x-terminal-emulator -e bash "$0" "$@" && LAUNCHED=1
    fi
    # Essai avec les émulateurs courants
    if [ "$LAUNCHED" -eq 0 ]; then
        for T in gnome-terminal xfce4-terminal konsole lxterminal mate-terminal tilix alacritty kitty xterm; do
            if command -v "$T" &>/dev/null; then
                case "$T" in
                    gnome-terminal|tilix) "$T" -- bash "$0" "$@" ;;
                    alacritty|kitty)      "$T" -e bash "$0" "$@" ;;
                    *)                    "$T" -e "bash '$0'" ;;
                esac
                LAUNCHED=1
                break
            fi
        done
    fi
    if [ "$LAUNCHED" -eq 0 ]; then
        MSG="Aucun terminal trouvé.\nInstallez-en un :\n  sudo apt install xterm"
        command -v zenity   &>/dev/null && zenity   --error --text="$MSG" && exit 1
        command -v xmessage &>/dev/null && xmessage "$MSG"  && exit 1
        echo "$MSG" >&2
    fi
    exit
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
