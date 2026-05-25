#!/usr/bin/env python3
"""
Karaoke ASS Subtitle Generator
Génère des fichiers .ass karaoké à partir d'un fichier audio en utilisant Whisper AI
"""

import argparse
import re
import sys
from pathlib import Path

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.prompt import Prompt, IntPrompt
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
    HAS_RICH = True
    console = Console()
except ImportError:
    HAS_RICH = False
    console = None


# ── Palettes de couleurs ───────────────────────────────────────────────────────
PRESET_COLORS = {
    "1": ("Blanc",        "#FFFFFF"),
    "2": ("Jaune",        "#FFFF00"),
    "3": ("Cyan",         "#00FFFF"),
    "4": ("Vert lime",    "#00FF00"),
    "5": ("Rouge",        "#FF3333"),
    "6": ("Bleu ciel",    "#3399FF"),
    "7": ("Orange",       "#FF8800"),
    "8": ("Rose",         "#FF66CC"),
    "9": ("Violet",       "#9933FF"),
    "0": ("Or",           "#FFD700"),
    "A": ("Turquoise",    "#00CED1"),
    "B": ("Corail",       "#FF6B6B"),
}

# ── Polices courantes ──────────────────────────────────────────────────────────
PRESET_FONTS = [
    "Arial",
    "Arial Black",
    "Impact",
    "Comic Sans MS",
    "Times New Roman",
    "Trebuchet MS",
    "Verdana",
    "Georgia",
    "Tahoma",
    "Courier New",
    "Ubuntu",
    "DejaVu Sans",
]

WHISPER_MODELS = ["tiny", "base", "small", "medium", "large"]

WHISPER_DESCRIPTIONS = {
    "tiny":   "Très rapide, moins précis     (~39M params)",
    "base":   "Rapide et correct             (~74M params)  ✓ recommandé",
    "small":  "Bon équilibre vitesse/qualité (~244M params)",
    "medium": "Très précis, plus lent        (~769M params)",
    "large":  "Meilleure précision           (~1.5G params)",
}


# ── Conversions couleurs ───────────────────────────────────────────────────────

def hex_to_ass(hex_color: str, alpha: int = 0) -> str:
    """Convertit #RRGGBB → &HAABBGGRR& (format ASS)"""
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"&H{alpha:02X}{b:02X}{g:02X}{r:02X}&"


def format_time_ass(seconds: float) -> str:
    """Secondes → H:MM:SS.cc"""
    seconds = max(0.0, seconds)
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = min(99, int(round((seconds % 1) * 100)))
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


# ── Correction des timestamps Whisper ─────────────────────────────────────────

def _fix_word_timing(words: list) -> list:
    """
    Whisper absorbe parfois le silence précédant la première syllabe dans le
    timestamp du premier mot (start=0, end=19s pour un mot de 0.3s).
    On détecte ces durées aberrantes et on recale le start juste avant le end.
    """
    if len(words) < 2:
        return words

    # Durée réelle de chaque mot (en secondes)
    durs = sorted(
        w["end"] - w["start"]
        for w in words
        if w["end"] > w["start"] and (w["end"] - w["start"]) < 5.0
    )
    if not durs:
        return words

    median_dur = durs[len(durs) // 2]
    typical    = max(0.1, min(median_dur, 0.6))   # durée "normale" de référence
    threshold  = max(median_dur * 6, 2.5)          # au-delà → silence absorbé

    fixed = []
    for w in words:
        dur = w["end"] - w["start"]
        if dur > threshold:
            fixed.append({**w, "start": max(w["start"], w["end"] - typical)})
        else:
            fixed.append(w)
    return fixed


# ── Génération du fichier ASS ──────────────────────────────────────────────────

def build_ass(
    segments: list,
    font_name: str,
    color_before: str,
    color_after: str,
    font_size: int = 60,
    bold: bool = True,
    outline_color: str = "#000000",
    back_color_hex: str = "#000000",
    back_alpha: int = 0xA0,
) -> str:
    """
    Génère le contenu ASS complet avec tags karaoké \\kf.

    color_before  → SecondaryColour  (paroles non encore chantées)
    color_after   → PrimaryColour    (paroles chantées / en cours)
    """
    primary   = hex_to_ass(color_after)
    secondary = hex_to_ass(color_before)
    outline   = hex_to_ass(outline_color)
    back      = hex_to_ass(back_color_hex, alpha=back_alpha)
    bold_val  = -1 if bold else 0

    lines = [
        "[Script Info]",
        "Title: Karaoke",
        "ScriptType: v4.00+",
        "WrapStyle: 0",
        "ScaledBorderAndShadow: yes",
        "PlayResX: 1920",
        "PlayResY: 1080",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, "
        "OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, "
        "ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
        "Alignment, MarginL, MarginR, MarginV, Encoding",
        f"Style: Default,{font_name},{font_size},"
        f"{primary},{secondary},{outline},{back},"
        f"{bold_val},0,0,0,100,100,0,0,1,3,1,2,20,20,50,1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]

    for seg in segments:
        words = seg.get("words") or []
        if not words:
            # Segment sans horodatage mot par mot → une seule entrée
            text = seg.get("text", "").strip()
            if not text:
                continue
            dur_cs = max(1, int(round((seg["end"] - seg["start"]) * 100)))
            kara = f"{{\\kf{dur_cs}}}{text}"
            lines.append(
                f"Dialogue: 0,{format_time_ass(seg['start'])},"
                f"{format_time_ass(seg['end'])},Default,,0,0,0,karaoke,{kara}"
            )
            continue

        words = _fix_word_timing(words)

        line_start = words[0]["start"]
        line_end   = words[-1]["end"]
        parts = []

        for i, w in enumerate(words):
            # Durée = intervalle jusqu'au prochain mot (highlight continu)
            if i < len(words) - 1:
                dur_cs = int(round((words[i + 1]["start"] - w["start"]) * 100))
            else:
                dur_cs = int(round((w["end"] - w["start"]) * 100))
            dur_cs = max(1, min(dur_cs, 500))   # cap à 5 s (évite les silences absorbés résiduels)
            parts.append(f"{{\\kf{dur_cs}}}{w['word']}")

        kara_text = "".join(parts).strip()
        lines.append(
            f"Dialogue: 0,{format_time_ass(line_start)},"
            f"{format_time_ass(line_end)},Default,,0,0,0,karaoke,{kara_text}"
        )

    return "\n".join(lines)


# ── Interface interactive ──────────────────────────────────────────────────────

def _ask(prompt: str, default: str = "") -> str:
    if HAS_RICH:
        return Prompt.ask(prompt, default=default)
    val = input(f"{prompt} [{default}]: ").strip()
    return val if val else default


def select_model() -> str:
    if HAS_RICH:
        console.print("\n[bold cyan]Modèle Whisper[/bold cyan]  "
                      "[dim](précision ↑  vitesse ↓)[/dim]")
        tbl = Table(show_header=False, box=None, padding=(0, 2))
        for i, m in enumerate(WHISPER_MODELS, 1):
            tbl.add_row(f"[bold]{i}[/bold]", f"[cyan]{m:<8}[/cyan]",
                        WHISPER_DESCRIPTIONS[m])
        console.print(tbl)
        while True:
            c = Prompt.ask("Choix", default="2")
            if c.isdigit() and 1 <= int(c) <= len(WHISPER_MODELS):
                chosen = WHISPER_MODELS[int(c) - 1]
                console.print(f"  [green]→ {chosen}[/green]")
                return chosen
            console.print("[red]Choix invalide[/red]")
    else:
        print("\nModèle Whisper :")
        for i, m in enumerate(WHISPER_MODELS, 1):
            print(f"  {i}: {m:8}  {WHISPER_DESCRIPTIONS[m]}")
        c = input("Choix [2]: ").strip() or "2"
        if c.isdigit() and 1 <= int(c) <= len(WHISPER_MODELS):
            return WHISPER_MODELS[int(c) - 1]
        return "base"


def select_font() -> str:
    if HAS_RICH:
        console.print("\n[bold cyan]Police de caractère[/bold cyan]")
        tbl = Table(show_header=False, box=None, padding=(0, 2))
        for i, f in enumerate(PRESET_FONTS, 1):
            tbl.add_row(f"[bold]{i:>2}[/bold]", f)
        tbl.add_row("[bold] C[/bold]", "Police personnalisée")
        console.print(tbl)
        while True:
            c = Prompt.ask("Choix", default="1").strip().upper()
            if c.isdigit() and 1 <= int(c) <= len(PRESET_FONTS):
                font = PRESET_FONTS[int(c) - 1]
                console.print(f"  [green]→ {font}[/green]")
                return font
            if c == "C":
                font = Prompt.ask("Nom de la police").strip()
                if font:
                    return font
            console.print("[red]Choix invalide[/red]")
    else:
        print("\nPolice de caractère :")
        for i, f in enumerate(PRESET_FONTS, 1):
            print(f"  {i:>2}: {f}")
        print("   C: Police personnalisée")
        c = input("Choix [1]: ").strip().upper() or "1"
        if c.isdigit() and 1 <= int(c) <= len(PRESET_FONTS):
            return PRESET_FONTS[int(c) - 1]
        if c == "C":
            return input("Nom de la police : ").strip() or "Arial"
        return "Arial"


def _color_preview_row(name: str, hex_val: str) -> str:
    """Génère une ligne avec bloc de couleur pour rich."""
    r, g, b = int(hex_val[1:3], 16), int(hex_val[3:5], 16), int(hex_val[5:7], 16)
    return f"rgb({r},{g},{b})"


def select_color(prompt_text: str, default_key: str = "1") -> str:
    if HAS_RICH:
        console.print(f"\n[bold cyan]{prompt_text}[/bold cyan]")
        tbl = Table(show_header=False, box=None, padding=(0, 2))
        for key, (name, hex_val) in PRESET_COLORS.items():
            rgb = _color_preview_row(name, hex_val)
            tbl.add_row(
                f"[bold]{key:>2}[/bold]",
                f"[{rgb}]██[/{rgb}] {name:<14}",
                f"[dim]{hex_val}[/dim]",
            )
        tbl.add_row("[bold] H[/bold]", "Couleur hex personnalisée", "[dim]#RRGGBB[/dim]")
        console.print(tbl)
        while True:
            c = Prompt.ask("Choix", default=default_key).strip().upper()
            if c in PRESET_COLORS:
                name, hex_val = PRESET_COLORS[c]
                rgb = _color_preview_row(name, hex_val)
                console.print(f"  [green]→[/green] [{rgb}]██[/{rgb}] {name}")
                return hex_val
            if c == "H":
                hex_val = Prompt.ask("Couleur hex (#RRGGBB)").strip()
                if re.match(r"^#[0-9A-Fa-f]{6}$", hex_val):
                    return hex_val
                console.print("[red]Format invalide — utilisez #RRGGBB[/red]")
            else:
                console.print("[red]Choix invalide[/red]")
    else:
        print(f"\n{prompt_text}")
        for key, (name, hex_val) in PRESET_COLORS.items():
            print(f"  {key:>2}: {name:<14} {hex_val}")
        print("   H: Couleur hex personnalisée")
        while True:
            c = input(f"Choix [{default_key}]: ").strip().upper() or default_key
            if c in PRESET_COLORS:
                return PRESET_COLORS[c][1]
            if c == "H":
                hex_val = input("Couleur hex (#RRGGBB): ").strip()
                if re.match(r"^#[0-9A-Fa-f]{6}$", hex_val):
                    return hex_val
                print("Format invalide.")
            else:
                print("Choix invalide")


# ── Transcription Whisper ──────────────────────────────────────────────────────

def transcribe(audio_path: str, model_name: str, language: str | None = None) -> dict:
    """Transcrit l'audio avec horodatage mot par mot."""
    try:
        import whisper
    except ImportError:
        _err(
            "openai-whisper n'est pas installé.\n"
            "Installez-le : pip install openai-whisper\n"
            "ou lancez   : bash install.sh"
        )
        sys.exit(1)

    # Paramètres optimisés pour les chansons (réduit les hallucinations)
    transcribe_opts = dict(
        word_timestamps=True,
        verbose=False,
        language=language,
        condition_on_previous_text=False,  # évite la propagation d'erreurs
        no_speech_threshold=0.6,           # meilleure détection des silences
        compression_ratio_threshold=2.4,   # filtre les hallucinations
        temperature=0.0,                   # sortie déterministe
        beam_size=5,                       # meilleure précision
    )

    if HAS_RICH:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(bar_width=30),
            console=console,
            transient=True,
        ) as prog:
            t = prog.add_task(f"Chargement du modèle [cyan]{model_name}[/cyan]…", total=None)
            model = whisper.load_model(model_name)
            prog.update(t, description="Transcription en cours… (peut prendre plusieurs minutes)")
            result = model.transcribe(audio_path, **transcribe_opts)
    else:
        print(f"Chargement du modèle '{model_name}'…")
        model = whisper.load_model(model_name)
        print("Transcription en cours…")
        result = model.transcribe(audio_path, **transcribe_opts)

    return result


def _err(msg: str) -> None:
    if HAS_RICH:
        console.print(f"[bold red]Erreur :[/bold red] {msg}")
    else:
        print(f"Erreur : {msg}", file=sys.stderr)


# ── Point d'entrée ─────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        prog="karaoke_gen",
        description="Générateur de sous-titres ASS Karaoké — propulsé par Whisper AI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples :
  python karaoke_gen.py chanson.mp3
  python karaoke_gen.py chanson.mp3 -o paroles.ass
  python karaoke_gen.py chanson.mp3 --model large --font "Arial Black" \\
         --color-before "#FFFFFF" --color-after "#FFFF00"
        """,
    )
    parser.add_argument("audio",            help="Fichier audio (mp3, wav, flac, m4a, ogg…)")
    parser.add_argument("-o", "--output",   help="Fichier .ass de sortie (défaut : même nom que l'audio)")
    parser.add_argument("--model",          choices=WHISPER_MODELS, help="Modèle Whisper")
    parser.add_argument("--font",           help="Police de caractère")
    parser.add_argument("--font-size",      type=int, default=60, help="Taille de la police (défaut : 60)")
    parser.add_argument("--color-before",   help="Couleur avant le chant  #RRGGBB  (défaut : blanc)")
    parser.add_argument("--color-after",    help="Couleur après/pendant   #RRGGBB  (défaut : jaune)")
    parser.add_argument("--no-bold",        action="store_true", help="Désactiver le gras")
    parser.add_argument("--language",       help="Code langue ISO (ex: fr, en, es) — laissez vide pour auto-détection")
    args = parser.parse_args()

    audio_path = Path(args.audio)
    if not audio_path.exists():
        _err(f"Fichier introuvable : {audio_path}")
        sys.exit(1)

    output_path = Path(args.output) if args.output else audio_path.with_suffix(".ass")

    # ── En-tête ────────────────────────────────────────────────────────────────
    if HAS_RICH:
        console.print(
            Panel.fit(
                "[bold magenta]🎤  Générateur de Sous-titres ASS Karaoké[/bold magenta]\n"
                "[dim]Propulsé par OpenAI Whisper — format .ass avec effet \\kf[/dim]",
                border_style="magenta",
            )
        )
        console.print(f"\n[bold]Fichier audio :[/bold]   [cyan]{audio_path}[/cyan]")
        console.print(f"[bold]Fichier sortie :[/bold]  [cyan]{output_path}[/cyan]")
    else:
        print("=" * 55)
        print("   Générateur de Sous-titres ASS Karaoké")
        print("=" * 55)
        print(f"Audio  : {audio_path}")
        print(f"Sortie : {output_path}")

    # ── Sélections interactives ────────────────────────────────────────────────
    model_name = args.model   or select_model()
    font_name  = args.font    or select_font()

    if HAS_RICH:
        font_size_str = Prompt.ask(
            "\n[bold cyan]Taille de la police[/bold cyan]", default=str(args.font_size)
        )
        font_size = int(font_size_str) if font_size_str.isdigit() else args.font_size
    else:
        raw = input(f"\nTaille de la police [{args.font_size}]: ").strip()
        font_size = int(raw) if raw.isdigit() else args.font_size

    if HAS_RICH:
        console.rule("[bold yellow]Couleurs des paroles[/bold yellow]")
    else:
        print("\n── Couleurs des paroles ──")

    color_before = args.color_before or select_color(
        "Couleur AVANT le chant  (paroles en attente) :", default_key="1"
    )
    color_after = args.color_after or select_color(
        "Couleur PENDANT / APRÈS le chant :", default_key="2"
    )

    # ── Récapitulatif ──────────────────────────────────────────────────────────
    if HAS_RICH:
        console.rule("[bold green]Récapitulatif[/bold green]")
        tbl = Table(show_header=False, box=None, padding=(0, 2))

        def rgb_block(hex_val: str) -> str:
            r, g, b = int(hex_val[1:3], 16), int(hex_val[3:5], 16), int(hex_val[5:7], 16)
            return f"[rgb({r},{g},{b})]██[/rgb({r},{g},{b})]"

        tbl.add_row("Modèle Whisper",       f"[cyan]{model_name}[/cyan]")
        tbl.add_row("Police",               f"[cyan]{font_name}[/cyan]  [dim]{font_size}px[/dim]")
        tbl.add_row("Couleur avant chant",  f"{rgb_block(color_before)} [dim]{color_before}[/dim]")
        tbl.add_row("Couleur après chant",  f"{rgb_block(color_after)} [dim]{color_after}[/dim]")
        if args.language:
            tbl.add_row("Langue forcée",    f"[cyan]{args.language}[/cyan]")
        console.print(tbl)
        confirm = Prompt.ask("\nLancer la génération ?", choices=["o", "n"], default="o")
        if confirm.lower() == "n":
            console.print("[yellow]Annulé.[/yellow]")
            sys.exit(0)
    else:
        print("\nRécapitulatif :")
        print(f"  Modèle  : {model_name}")
        print(f"  Police  : {font_name} {font_size}px")
        print(f"  Avant   : {color_before}")
        print(f"  Après   : {color_after}")
        confirm = input("\nLancer la génération ? [O/n] : ").strip().lower()
        if confirm == "n":
            print("Annulé.")
            sys.exit(0)

    # ── Transcription ──────────────────────────────────────────────────────────
    result = transcribe(str(audio_path), model_name, language=args.language or None)

    # ── Génération ASS ─────────────────────────────────────────────────────────
    if HAS_RICH:
        with console.status("Génération du fichier ASS…"):
            ass_content = build_ass(
                segments=result["segments"],
                font_name=font_name,
                color_before=color_before,
                color_after=color_after,
                font_size=font_size,
                bold=not args.no_bold,
            )
    else:
        print("Génération du fichier ASS…")
        ass_content = build_ass(
            segments=result["segments"],
            font_name=font_name,
            color_before=color_before,
            color_after=color_after,
            font_size=font_size,
            bold=not args.no_bold,
        )

    output_path.write_text(ass_content, encoding="utf-8-sig")

    total_words = sum(len(s.get("words") or []) for s in result["segments"])
    total_lines = len(result["segments"])
    detected_lang = result.get("language", "inconnue")

    if HAS_RICH:
        console.print(
            Panel(
                f"[bold green]✓  Fichier ASS généré avec succès ![/bold green]\n\n"
                f"  [bold]Fichier  :[/bold] [cyan]{output_path}[/cyan]\n"
                f"  [bold]Lignes   :[/bold] {total_lines}\n"
                f"  [bold]Mots     :[/bold] {total_words}\n"
                f"  [bold]Langue   :[/bold] [cyan]{detected_lang}[/cyan]",
                border_style="green",
            )
        )
    else:
        print(f"\n✓  Fichier généré : {output_path}")
        print(f"   {total_lines} lignes · {total_words} mots · langue : {detected_lang}")


if __name__ == "__main__":
    main()
