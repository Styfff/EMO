#!/usr/bin/env python3
"""Choisit les effets, votre mot et l'en-tête, puis met la durée de la vidéo à jour.
Exemples (depuis le dossier kit/) :
  python3 tools/configurer.py --effets 20 42 66 --mot "BONJOUR"
  python3 tools/configurer.py --effets 16 --mot "AVANT|APRES" --sans-entete
  python3 tools/configurer.py --tous                      (les 72, mots d'origine)
Chaque effet dure 6 s. Mot : en MAJUSCULES ; "A|B" pour les effets à deux ou trois mots (7, 12, 15, 16, 56)."""
import argparse, json, pathlib, re
K = pathlib.Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser(); ap.add_argument("--effets", type=int, nargs="*"); ap.add_argument("--tous", action="store_true")
ap.add_argument("--mot", default=None, help="votre mot, appliqué à tous les effets choisis"); ap.add_argument("--sans-entete", action="store_true")
a = ap.parse_args()
eff = list(range(1, 73)) if a.tous or not a.effets else a.effets
bad = [n for n in eff if not 1 <= n <= 72]
if bad: raise SystemExit(f"numéros invalides : {bad} (1 à 72)")
mots = {n: a.mot for n in eff} if a.mot else {}
cfg = "// config.js — écrit par tools/configurer.py\nexport const CONFIG = " + json.dumps({"effets": eff, "mots": mots, "entete": not a.sans_entete}, ensure_ascii=False, indent=2) + ";\n"
(K / "assets" / "config.js").write_text(cfg, encoding="utf-8")
dur = 6 * len(eff); h = (K / "index.html").read_text(encoding="utf-8"); h = re.sub(r'data-duration="\d+(\.\d+)?"', f'data-duration="{dur}"', h); (K / "index.html").write_text(h, encoding="utf-8")
print(f"{len(eff)} effet(s), {dur} s, mot : {a.mot or '(mots d’origine)'}, en-tête : {'non' if a.sans_entete else 'oui'}")
print("Rendu :  npx --yes hyperframes@0.8.98 render --quality high --output ma-video.mp4")
