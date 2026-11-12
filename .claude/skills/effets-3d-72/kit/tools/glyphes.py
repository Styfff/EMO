#!/usr/bin/env python3
"""Génère assets/glyphs.js (contours vectoriels des lettres) à partir des polices libres du dossier polices/.
Usage : python3 tools/glyphes.py        (depuis le dossier kit/ ; demande : pip install fonttools)"""
import json, pathlib, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.boundsPen import BoundsPen
K = pathlib.Path(__file__).resolve().parent.parent
POL = {  # clé utilisée par les effets : (fichier, axes variables, nom affiché)
  "helv": ("oswald__Oswald[wght].ttf", {"wght": 700}, "Oswald Bold"),
  "din": ("barlowcondensed__BarlowCondensed-Bold.ttf", {}, "Barlow Condensed Bold"),
  "round": ("nunito__Nunito[wght].ttf", {"wght": 900}, "Nunito Black"),
  "futura": ("jost__Jost[wght].ttf", {"wght": 700}, "Jost Bold"),
  "futc": ("bebasneue__BebasNeue-Regular.ttf", {}, "Bebas Neue"),
  "impact": ("anton__Anton-Regular.ttf", {}, "Anton"),
  "didot": ("playfairdisplay__PlayfairDisplay[wght].ttf", {"wght": 900}, "Playfair Display Black"),
  "rock": ("zillaslab__ZillaSlab-Bold.ttf", {}, "Zilla Slab Bold"),
  "bodoni": ("bodonimoda__BodoniModa[opsz,wght].ttf", {"wght": 800, "opsz": 28}, "Bodoni Moda ExtraBold"),
  "phos": ("bungee__Bungee-Regular.ttf", {}, "Bungee"),
  "bask": ("librebaskerville__LibreBaskerville[wght].ttf", {"wght": 700}, "Libre Baskerville Bold"),
  "marker": ("permanentmarker__PermanentMarker-Regular.ttf", {}, "Permanent Marker"),
  "avenir": ("montserrat__Montserrat[wght].ttf", {"wght": 800}, "Montserrat ExtraBold"),
  "black": ("archivoblack__ArchivoBlack-Regular.ttf", {}, "Archivo Black"),
  "copper": ("cinzel__Cinzel[wght].ttf", {"wght": 900}, "Cinzel Black"),
  "typew": ("courierprime__CourierPrime-Bold.ttf", {}, "Courier Prime Bold"),
  "gill": ("rubik__Rubik[wght].ttf", {"wght": 900}, "Rubik Black"),
  "optima": ("alegreyasans__AlegreyaSans-Black.ttf", {}, "Alegreya Sans Black"),
  "brad": ("caveat__Caveat[wght].ttf", {"wght": 700}, "Caveat Bold"),
  "menlo": ("jetbrainsmono__JetBrainsMono[wght].ttf", {"wght": 800}, "JetBrains Mono ExtraBold"),
  "cochin": ("cormorantgaramond__CormorantGaramond[wght].ttf", {"wght": 700}, "Cormorant Garamond Bold"),
}
CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZÉÈÊËÀÂÇÔÎÏÛÙÜŒÆ0123456789·-.!'&/+:,?%× "
out = {}
for key, (fn, axes, name) in POL.items():
    f = TTFont(K / "polices" / fn)
    if "fvar" in f:
        f = instancer.instantiateVariableFont(f, {k: max(lo, min(hi, axes.get(k, d))) for k, (lo, d, hi) in {x.axisTag: (x.minValue, x.defaultValue, x.maxValue) for x in f['fvar'].axes}.items()})
    gs, cmap, G = f.getGlyphSet(), f.getBestCmap(), {}
    for ch in CH:
        g = cmap.get(ord(ch))
        if g is None: continue
        pen = DecomposingRecordingPen(gs); gs[g].draw(pen); cmds = []
        for op, a in pen.value:
            if op == "moveTo": cmds.append(["M", *a[0]])
            elif op == "lineTo": cmds.append(["L", *a[0]])
            elif op == "curveTo": cmds.append(["C", *a[0], *a[1], *a[2]] if len(a) == 3 else ["L", *a[-1]])
            elif op == "qCurveTo":
                pts = list(a)
                if pts[-1] is None: continue
                for i in range(len(pts) - 1):
                    p, n = pts[i], pts[i + 1]; end = n if i == len(pts) - 2 else ((p[0] + n[0]) / 2, (p[1] + n[1]) / 2); cmds.append(["Q", p[0], p[1], end[0], end[1]])
            else: cmds.append(["Z"])
        G[ch] = {"adv": gs[g].width, "c": [[c[0]] + [round(v, 1) for v in c[1:]] for c in cmds]}
    bp = BoundsPen(gs); gs[cmap[ord("H")]].draw(bp); cap = bp.bounds[3]
    n = next(i for i, c in enumerate(G["I"]["c"]) if c[0] == "Z"); pts = [(c[-2], c[-1]) for c in G["I"]["c"][:n]]
    area = sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))
    out[key] = {"name": name, "upm": f["head"].unitsPerEm, "cap": cap, "ccw": area > 0, "g": G}
    miss = [c for c in CH if c not in G]
    print(f"{key:7s} {name:28s} {len(G)} glyphes" + (f"  manquants : {''.join(miss)}" if miss else ""))
(K / "assets" / "glyphs.js").write_text("export const FONTS = " + json.dumps(out, separators=(",", ":"), ensure_ascii=False) + ";\n", encoding="utf-8")
print("assets/glyphs.js :", (K / "assets" / "glyphs.js").stat().st_size // 1024, "Ko")
